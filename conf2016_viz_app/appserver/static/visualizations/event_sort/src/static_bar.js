define([
            'jquery',
            'underscore',
            'vizapi/SplunkVisualizationBase',
            'vizapi/SplunkVisualizationUtils',
            'd3'
        ],
        function(
            $,
            _,
            SplunkVisualizationBase,
            vizUtils,
            d3
        ) {
 
    return SplunkVisualizationBase.extend({
 
        initialize: function() {
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

            this.$el = $(this.el);
            
            this.$el.height('100%').width('100%').addClass('splunk-event-sort');

            this.nodeQueue = [];

            this.initialRun = true;
        },

        formatData: function(data) {
            console.log('Format data ', data);

            if (data.rows.length < 1 || data.fields.length < 1) {
                return false;
            }
            
            if(data.fields[0].name === '_time'){
                
                // Get unique values of the second column
                var buckets = _(data.rows).chain().unzip().rest().first().uniq().value();
                
                return {
                    rows: data.rows,
                    buckets: buckets
                };
            }
            else {
                return _.map(data.rows, function(row){
                    return {
                        name: row[0],
                        value: row[1]
                    }
                });
            }
        },
 
        updateView: function(data, config) {

            console.log('Update', data);

            if(!data){
                return;
            }
            this.$el.empty();
            
            var margin = {top: 20, right: 20, bottom: 70, left: 20},
                width = this.$el.width() - margin.left - margin.right,
                height = this.$el.height() - margin.top - margin.bottom;

            var names = _.map(data, function(row){ 
                return row.name; 
            });

            var maxValue = _.max(_.map(data, function(row){ 
                return row.value
            }));

            var x = d3.scaleBand().rangeRound([0, width]).paddingInner(0).domain(names);
            var y = d3.scaleLinear().range([height, 0]).domain([0, maxValue]);

            var xAxis = d3.axisBottom(x)
                .tickSizeInner(-20)
                
            var yAxis = d3.axisLeft(y)
                .ticks(10);

            var svg = d3.select(this.el).append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
            .append('g')
                .attr('transform', 
                    'translate(' + margin.left + ',' + margin.top + ')');
            
            var bars = svg.selectAll('bar')
                .data(data).enter().append('rect')
                .style('fill', 'steelblue')
                .attr('x', function(d) { return x(d.name); })
                .attr('width', x.bandwidth())
                .attr('y', function(d) { return y(d.value); })
                .attr('height', function(d) { return height - y(d.value); });

            var lables = svg.selectAll('text')
                .data(data)
                .enter()
                .append('text')
                .text(function (d) { return d.name })
                .attr('transform', function(d) { 
                    return 'translate(' + (x(d.name) + 10) + ',' + (height - 10) + ')'; 
                })
                .attr('class', 'bar-label')

            return this;
        },

        getInitialDataParams: function() {
            return {
                outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                count: 10000
            };
        },

        reflow: function() {
            this.invalidateUpdateView();
        },

        _getEscapedProperty: function(name, config) {
            var propertyValue = config[this.getPropertyNamespaceInfo().propertyNamespace + name];
            return vizUtils.escapeHtml(propertyValue);
        }
    });
});
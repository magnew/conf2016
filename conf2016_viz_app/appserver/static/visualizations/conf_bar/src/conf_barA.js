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
            
            this.$el.height('100%').width('100%').addClass('splunk-conf-bar');

            this.nodeQueue = [];

            this.initialRun = true;
        },

        formatData: function(data) {
            if (data.rows.length < 1 || data.fields.length < 1) {
                return false;
            }
            
            return _.map(data.rows, function(row){
                return {
                    name: row[0],
                    count: parseInt(row[1])
                }
            });  
        },
 
        updateView: function(data, config) {
            if(!data){
                return;
            }

            var margin = {top: 20, right: 20, bottom: 20, left: 20},
                width = this.$el.width() - margin.left - margin.right,
                height = this.$el.height() - margin.top - margin.bottom;

            this.$el.empty();
            var svg = d3.select(this.el).append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
            .append('g')
                .attr('transform', 
                    'translate(' + margin.left + ',' + margin.top + ')');

            buckets = _.pluck(data, 'name');

            var maxValue = _.max(_.map(data, function(row){ 
                return row.count;
            }));

            var xScale = d3.scaleBand()
                .rangeRound([0, width])
                .paddingInner(0)
                .domain(buckets);

            var yScale = d3.scaleLinear()
                .range([height, 0])
                .domain([0, maxValue]);
            
            var bars = svg.selectAll('bar')
                .data(data).enter().append('rect')
                .style('fill', 'steelblue')
                .attr('x', function(d) { return xScale(d.name); })
                .attr('width', xScale.bandwidth())
                .attr('y', function(d) { return yScale(d.count); })
                .attr('height', function(d) { return height - yScale(d.count); });

            var lables = svg.selectAll('text')
                .data(data)
                .enter()
                .append('text')
                .text(function (d) { return d.name })
                .attr('transform', function(d) { 
                    return 'translate(' + (xScale(d.name) + 10) + ',' + (height - 5) + ')'; 
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
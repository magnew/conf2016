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
        },

        setupView: function() {

            this.margin = {top: 20, right: 20, bottom: 20, left: 20};
            this.width = this.$el.width() - this.margin.left - this.margin.right;
            this.height = this.$el.height() - this.margin.top - this.margin.bottom;

            this.svg = d3.select(this.el).append('svg')
                .attr('width', this.width + this.margin.left + this.margin.right)
                .attr('height', this.height + this.margin.top + this.margin.bottom)
                .attr('background', this.backgroundColor || '#fff')
            .append('g')
                .attr('transform', 
                    'translate(' + this.margin.left + ',' + this.margin.top + ')');
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

            var that = this;
            
            this.backgroundColor = this._getEscapedProperty('backgroundColor', config) || '#fff';
            this.mainColor = this._getEscapedProperty('mainColor', config) || '#6db7c6';

            this.$el.find('svg').css('background', this.backgroundColor);

            buckets = _.pluck(data, 'name');

            var maxValue = _.max(_.map(data, function(row){ 
                return row.count;
            }));
            var xScale = d3.scaleBand()
                .rangeRound([0, that.width])
                .paddingInner(0)
                .domain(buckets);

            var yScale = d3.scaleLinear()
                .range([that.height, 0])
                .domain([0, maxValue]);
            
            var bars = that.svg.selectAll('rect')
                .data(data)
                .enter()
                .append('rect')
                .style('fill', that.mainColor)
                .attr('x', function(d) { return xScale(d.name); })
                .attr('width', xScale.bandwidth())
                .attr('y', function(d) { return yScale(d.count); })
                .attr('height', function(d) { return that.height - yScale(d.count); })
            
            that.svg.selectAll('rect')
                .style('fill', that.mainColor)

            that.svg.selectAll('rect')
                .data(data)
                .transition()
                .duration(400)
                .attr('x', function(d) { return xScale(d.name); })                
                .attr('width', xScale.bandwidth())                
                .attr('y', function(d) { 
                    return yScale(d.count); })
                .attr('height', function(d){
                    return that.height - yScale(d.count);
                })
            
            that.svg.selectAll('rect')
                .data(data)
                .exit()
                .remove();

            var lables = that.svg.selectAll('text')
                .data(data)
                .enter()
                .append('text')
                .text(function (d) { return d.name })
                .attr('transform', function(d) { 
                    return 'translate(' 
                        + (xScale(d.name) + xScale.bandwidth() / 2) 
                        + ',' 
                        + (that.height - 5) 
                        + ')'; 
                })
                .attr('class', 'bar-label')

            that.svg.selectAll('text')
                .data(data)
                .text(function (d) { return d.name })

            that.svg.selectAll('text')
                .data(data)
                .transition()
                .duration(400)
                .attr('transform', function(d) { 
                    return 'translate(' 
                        + (xScale(d.name) + xScale.bandwidth() / 2) 
                        + ',' 
                        + (that.height - 5) 
                        + ')'; 
                })
 
            that.svg.selectAll('text')
                .data(data)
                .exit()
                .remove();

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
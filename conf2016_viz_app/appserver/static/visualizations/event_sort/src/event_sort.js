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

    function randomBetween(min, max){
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
 
    return SplunkVisualizationBase.extend({
 
        initialize: function() {
            SplunkVisualizationBase.prototype.initialize.apply(this, arguments);

            this.$el = $(this.el);
            
            this.$el.height('100%').width('100%').addClass('splunk-event-sort');

            // Data points move from the dataQueue to the dropQueue to the bars
            this.dataQueue = [];
            this.dropQueue = [];
            this.barData = [];

            // Drop nodes represent the actual falling drops
            this.dropNodes = [];

            // A lookup of how tall the bars are
            this.barTops = {};

            this.readyToUpdate = true;
        },

        setupView: function(){
            this.margin = {top: 20, right: 20, bottom: 70, left: 20},
            this.width = this.$el.width() - this.margin.left - this.margin.right,
            this.height = this.$el.height() - this.margin.top - this.margin.bottom;
            
            this.svg = d3.select(this.el).append('svg')
                .attr('width', this.width + this.margin.left + this.margin.right)
                .attr('height', this.height + this.margin.top + this.margin.bottom)
            .append('g')
                .attr('transform', 
                    'translate(' + this.margin.left + ',' + this.margin.top + ')');
            setInterval(this._updateData.bind(this), 700)
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
            this.dataQueue = this.dataQueue.concat(data);

            this.barData = _.map(data, function(d){
                return {
                    name: d.name,
                    count: 0
                }
            });

            this.buckets = _.pluck(data, 'name');

            _.each(this.buckets, function(bucket){
                this.barTops[bucket] = this.height;
            }, this);

            var maxValue = _.max(_.map(data, function(row){ 
                return row.count;
            }));
            
            this.xScale = d3.scaleBand()
                .rangeRound([0, this.width])
                .paddingInner(0)
                .domain(this.buckets);

            this.yScale = d3.scaleLinear()
                .range([this.height, 0])
                .domain([0, 3000]);

            this._updateBars();

            this.readyToUpdate = true;

            return this;
        },

        _updateData: function(){
            if(this.readyToUpdate) {
                var dataEmpty = _.every(this.dataQueue, function(d){
                    return d.count < 1; 
                });
                if(this.barData.length < 1 || dataEmpty){
                    return;
                }
                var speed = 100;
            
                _.each(this.dataQueue, function(d){
                    var liveDatum = _.find(this.barData, function(l){
                        return l.name === d.name;
                    });
                    if(d.count > speed) {
                        liveDatum.count += speed;
                        d.count -=speed;
                    }
                    else {
                        liveDatum.count += d.count;
                        d.count = 0;
                    }
                }, this);
                this._draw(this.buckets, this.barData)    
            }
        },

        _updateBars: function() {
            var that = this;
            var data = that.barData;
            var bars = that.svg.selectAll('rect')
                    .data(data)
                    .enter()
                    .append('rect')
                    .style('fill', 'rgb(171, 190, 191)')
                    .attr('x', function(d) { return that.xScale(d.name); })
                    .attr('width', that.xScale.bandwidth())
                    .attr('y', function(d) { return that.yScale(d.count); })
                    .attr('height', function(d) { 
                        return that.height - that.yScale(d.count); 
                    });
                
                that.svg.selectAll('rect')
                    .data(data)
                    .transition()
                    .duration(200)
                    .attr('y', function(d) { 
                        var top = that.yScale(d.count);
                        that.barTops[d.name] = top;
                        return that.yScale(d.count); })
                    .attr('height', function(d){
                        return that.height - that.yScale(d.count);
                    })

                var lables = that.svg.selectAll('text')
                    .data(data)
                    .enter()
                    .append('text')
                    .text(function (d) { return d.name })
                    .attr('transform', function(d) { 
                        return 'translate(' + (that.xScale(d.name) + 10) + ',' + (that.height - 10) + ')'; 
                    })
                    .attr('class', 'bar-label')
        },

        _draw: function(buckets, data){
            var that = this;
            
            this.dropNodes = this.dropNodes.concat(_.map(this.buckets, function(b){
                return {
                    type: b,
                    r: randomBetween(2, 6),
                    x: randomBetween(that.xScale(b), that.xScale(b) + that.xScale.bandwidth()),
                    y: 0
                }
            }));

            // this.dropNodes.push({
            //         type: 'splunkd',
            //         r: randomBetween(2, 8),
            //         x: randomBetween(x('splunkd'), x('splunkd') + x.bandwidth()),
            //         y: 0
            //     })

            if(!this.simulation){
                this.simulation = d3.forceSimulation(this.dropNodes)
                    .alphaDecay([0])
                    .velocityDecay(0.01)
                    .force('y', d3.forceY([that.height]).strength(0.001))
                    .on('tick', ticked);
                
                function ticked(){
                    _.each(that.dropNodes, function(node){
                        if(!node.dead && node.y >= that.barTops[node.type]){
                            node.dead = true;
                            node.r = 1e-6;
                            that._updateBars();
                        }
                    });
                    that.svg.selectAll('circle')
                        .attr('cx', function(d) { return d.x; })
                        .attr('cy', function(d) { return d.y; })
                        .attr('r', function(d) { return d.r; });    
                }
            }
            else {
                this.simulation.nodes(this.dropNodes)
            }
            that.svg.selectAll('circle')
                .data(this.dropNodes)
            .enter().append('circle')
                .attr('cx', function(d) { return d.x; })
                .attr('cy', function(d) { return d.y; })
                .attr('r', function(d) { return d.r; })
                .style('fill', 'rgb(171, 190, 230)')
        
            that.dropNodes = _.filter(that.dropNodes, function(node){
                return !node.dead;
            });
            console.log('nodes length', that.dropNodes.length);
            setTimeout(function(){
                if(that.dropNodes.length < 1){
                    that.simulation.stop()
                }
            }, 1000);
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
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

            // Draw constant objects
            //this._drawConstantObjects();

            this.nodeQueue = [];

            this.initialRun = true;
        },

        setupView: function() {
            // Here we set up the initial view layout
            var margin = {top: 30, right: 30, bottom: 30, left: 30};
            var availableWidth = parseInt(this.$el.width(), 10);
            var availableHeight = parseInt(this.$el.height(), 10);

            var svg = d3.select(this.el)
                .append('svg')
                .attr('width', availableWidth)
                .attr('height', availableHeight)
                .attr('pointer-events', 'all');

            this._viz = { container: this.$el, svg: svg, margin: margin};
        },

        formatData: function(data) {
            console.log('Format data with', data);

            if (data.rows.length < 1 || data.fields.length < 1) {
                return false;
            }
    
            // Get unique values of the second column
            var buckets = _(data.rows).chain().unzip().rest().first().uniq().value();
            
            return {
                rows: data.rows,
                buckets: buckets
            };
        },
 
        updateView: function(data, config) {

            if (!data.rows || data.rows.length < 1) {
                return
            }
            
            var containerHeight = this.$el.height();
            var containerWidth = this.$el.width(); 

            var svg = $(this._viz.svg[0]);
            svg.height(containerHeight);
            svg.width(containerWidth);

            if(!_.isEqual(data.buckets, this.buckets)){
                this.buckets = data.buckets
                this._drawConstantObjects(containerWidth, containerHeight);
            }

            return;

            console.log('dataRows', dataRows);
            if (!dataRows || dataRows.length === 0 || dataRows[0].length === 0) {
                return this;
            }
            var fields = data.fields;

            console.log('fields', fields);

            this.oldTimes = this.times || [];
            this.times = _.map(dataRows, function(row){
                return row[0];
            });

            console.log('this.times', this.times);
            var newTimes = _.difference(this.times, this.oldTimes);

            var newNodes = _.filter(dataRows, function(row){
                return _.contains(newTimes, row[0]);
            });

            if(!this.initialRun){
                this.nodeQueue = this.nodeQueue.concat(newNodes);
            }

            this.initialRun = false;

            return this;
        },

        _drawConstantObjects: function(){

            var $svg = $(this._viz.svg[0]);
            $svg.empty();
            
            var graphWidth = $svg.width()
            var graphHeight = $svg.height();
            var graph = this._viz.svg;

            var color = d3.scale.category20b();

            var xScale = d3.scale.ordinal()
                    .domain(this.buckets)
                    .rangeBands([this._viz.margin.left , graphWidth - this._viz.margin.right]);

            var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient("bottom")
                .tickSize(0);

            var axisContainer = graph.append('g')
                .attr('class', 'xaxis axis')
                .attr("transform", "translate(0," + (graphHeight - 30) + ")")
                .call(xAxis);
            
            var sources = graph.selectAll('circle')
                .data(this.buckets)
              .enter().append('svg:circle')
                .attr('r', 12)
                .attr('cx', function(d) { return xScale(d); })
                .attr('cy', function(d) { 20; })
                .style('fill', 'black')
                
            return;

            var force = d3.layout.force()
                .gravity(0)
                .charge(-2)
                .size([graphWidth, graphHeight]);

            var syncs = force.nodes();


                a = {type: 'splunk_web_access', x: 500, y: graphHeight * 0.125, fixed: true},
                b = {type: 'splunkd', x: 500, y: graphHeight * 0.375, fixed: true},
                c = {type: 'splunkd_ui_access', x: 500, y: graphHeight * 0.625, fixed: true},
                d = {type: 'other', x: 500, y: graphHeight * 0.875, fixed: true};

            syncs.push(a, b, c, d);

            var svg = d3.select(this.el).append('svg')
                .attr('width', graphWidth)
                .attr('height', graphHeight);

            svg.append('svg:rect')
                .attr('width', graphWidth)
                .attr('height', graphHeight);

            svg.selectAll('circle')
                .data(syncs)
              .enter().append('svg:circle')
                .attr('r', 12)
                .attr('cx', function(d) { return d.x; })
                .attr('cy', function(d) { return d.y; })
                .style('fill', fill)
                .call(force.drag);

            var lables = svg.selectAll('text')
                .data(syncs)
                .enter()
                .append('text')
                .text(function(d){ return d.type})
                .attr('x', function(d) { return d.x + 45; })
                .attr('y', function(d) { return d.y + 5; })
                .style('font-size', '21px')
                .style('fill', function(d) { return color(d.type); });

            var nodes = force.nodes();

            force.on("tick", function(e) {
                var k = e.alpha * .07;
                nodes.forEach(function(node) {
                    
                    var center = syncs[that.typeLookup[node.type]] || syncs[3];
                    node.x += (center.x - node.x) * k;
                    node.y += (center.y - node.y) * k;
                });

                svg.selectAll("circle")
                    .attr("cx", function(d) { return d.x; })
                    .attr("cy", function(d) { return d.y; });                
            });

            function fill(d){
                return color(d.type);
            }

            function addNodeFromQueue(){
                var newNode = that.nodeQueue.shift();
                if(!newNode){
                    return;
                }
                var p1 = [20, graphHeight / 2];
                var node = {
                    type: _.contains(_.keys(that.typeLookup), newNode[1]) ? newNode[1] : 'other',
                    x: p1[0], 
                    y: p1[1]
                };

                svg.append('svg:circle')
                  .data([node])
                  .attr('cx', function(d) { return d.x; })
                  .attr('cy', function(d) { return d.y; })
                  .attr('r', 4.5)
                  .style('fill', fill)
                .transition()
                  .delay(8000)
                  .attr('r', 1e-6)
                  .each('end', function() { nodes.splice(4, 1); })
                  .remove();

                nodes.push(node);
                force.start();
            }

            setInterval(function(){
                var speed = Math.ceil(that.nodeQueue.length / 500) || 1;
                //console.log(that.nodeQueue.length);
                // console.log(speed, 'x');
                for (var i = 0; i < speed; i++) {
                    addNodeFromQueue();
                };
            }, 130);
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
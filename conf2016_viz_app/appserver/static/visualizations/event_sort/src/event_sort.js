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
            
            var margin = {top: 20, right: 20, bottom: 70, left: 40},
                width = 600 - margin.left - margin.right,
                height = 300 - margin.top - margin.bottom;

            var names = _.map(data, function(row){ 
                return row.name; 
            });

            var maxValue = _.max(_.map(data, function(row){ 
                return row.value
            }));

            var x = d3.scaleBand().rangeRound([0, width]).paddingInner(0.05).domain(names);
            var y = d3.scaleLinear().range([height, 0]).domain([0, maxValue]);

            var xAxis = d3.axisBottom(x);

            var yAxis = d3.axisLeft(y)
                .ticks(10);

            var svg = d3.select(this.el).append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
            .append('g')
                .attr('transform', 
                    'translate(' + margin.left + ',' + margin.top + ')');

            // x.domain(data.map(function(d) { return d.date; }));
            //y.domain([0, d3.max(data, function(d) { return d.value; })]);

            svg.append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(0,' + height + ')')
                .call(xAxis)
                .selectAll('text')
                .style('text-anchor', 'end')
                .attr('dx', '-.8em')
                .attr('dy', '-.55em')
                .attr('transform', 'rotate(-90)' );

            svg.append('g')
                .attr('class', 'y axis')
                .call(yAxis)
                .append('text')
                .attr('transform', 'rotate(-90)')
                .attr('y', 6)
                .attr('dy', '.71em')
                .style('text-anchor', 'end')
                .text('Value ($)');

            var bars = svg.selectAll('bar')
                .data(data).enter().append('rect')
                .style('fill', 'steelblue')
                .attr('x', function(d) { return x(d.name); })
                .attr('width', x.bandwidth())
                .attr('y', function(d) { return y(d.value); })
                .attr('height', function(d) { return height - y(d.value); });

            return this;
        },

        _drawConstantObjects: function(){

            var $svg = $(this._viz.svg);
            $svg.empty();
            
            var graphWidth = $svg.width()
            var graphHeight = $svg.height();
            var graph = this._viz.svg;

            var color = d3.scaleOrdinal(d3.schemeCategory10)

            debugger;

            var xScale = d3.scaleBand().rangeRound([this._viz.margin.left , graphWidth - this._viz.margin.right]).paddingInner(0.05)
                    .domain(this.buckets);
                    

            var xAxis = d3.axisBottom(xScale);

            graph.append('g')
                .attr('class', 'xaxis axis')
                .attr('transform', 'translate(0,' + (graphHeight - 30) + ')')
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

            force.on('tick', function(e) {
                var k = e.alpha * .07;
                nodes.forEach(function(node) {
                    
                    var center = syncs[that.typeLookup[node.type]] || syncs[3];
                    node.x += (center.x - node.x) * k;
                    node.y += (center.y - node.y) * k;
                });

                svg.selectAll('circle')
                    .attr('cx', function(d) { return d.x; })
                    .attr('cy', function(d) { return d.y; });                
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
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

            this.liveData = [];

            this.initialRun = true;
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
            console.log('length ', data.rows.length);

            if (data.rows.length < 1 || data.fields.length < 1) {
                return false;
            }
                
            // Get unique values of the second column
            // var buckets = _(data.rows).chain().unzip().rest().first().uniq().value();
            
            // return {
            //     rows: data.rows,
            //     buckets: buckets
            // };

            return _.map(data.rows, function(row){
                return {
                    name: row[0],
                    count: parseInt(row[1])
                }
            });   
        },
 
        updateView: function(data, config) {

            console.log('Update', data);

            if(!data){
                return;
            }
    
            this.dataQueue = this.nodeQueue.concat(data);

            this.liveData = _.map(data, function(d){
                return {
                    name: d.name,
                    count: 0
                }
            });

            this.buckets = _.pluck(data, 'name');

            // this._drawBars(_.pluck(data, 'name'), data)
            
            console.log('node length', this.nodeQueue.length);
            

            return this;
        },

        _updateData: function(){
            var dataEmpty = _.every(this.dataQueue, function(d){
                return d.count < 1;
            });
            if(this.liveData.length < 1 || dataEmpty){
                return;
            }
            var speed = 100;
            
            if(this.initialRun) {
                this._drawBars(this.buckets, this.liveData);
                this.initialRun = false;
            }
            else {
                _.each(this.dataQueue, function(d){
                    var liveDatum = _.find(this.liveData, function(l){
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
                this._drawBars(this.buckets, this.liveData)
            }     
        },

        _drawBars: function(buckets, data){
        
            var maxValue = _.max(_.map(data, function(row){ 
                return row.count;
            }));

            var x = d3.scaleBand().rangeRound([0, this.width]).paddingInner(0).domain(buckets);
            var y = d3.scaleLinear().range([this.height, 0]).domain([0, 3000]);

            var xAxis = d3.axisBottom(x)
                .tickSizeInner(-20)
                
            var yAxis = d3.axisLeft(y)
                .ticks(10);

            
            var that = this;
            var bars = this.svg.selectAll('rect')
                .data(data)
                .enter()
                .append('rect')
                .style('fill', 'steelblue')
                .attr('x', function(d) { return x(d.name); })
                .attr('width', x.bandwidth())
                .attr('y', function(d) { return y(d.count); })
                .attr('height', function(d) { return that.height - y(d.count); });
            
            this.svg.selectAll('rect')
                .data(data)
                .transition()
                .duration(500)
                .attr('y', function(d) { return y(d.count); })
                .attr('height', function(d){return that.height - y(d.count);})

            // this.svg.selectAll('rect')
            //     .data(data)
            //     .exit()
            // .transition()
            //     .duration(500)
            //     .style('width', 0)
            //     .remove();

            var lables = this.svg.selectAll('text')
                .data(data)
                .enter()
                .append('text')
                .text(function (d) { return d.name })
                .attr('transform', function(d) { 
                    return 'translate(' + (x(d.name) + 10) + ',' + (that.height - 10) + ')'; 
                })
                .attr('class', 'bar-label')

            // this.svg.selectAll('text')
            //     .data(data)
            //     .exit()
            //     .remove();
                

            // AXES

            // svg.append('g')
            //     .attr('class', 'y axis')
            //     .call(yAxis)
            //     .append('text')
            //     .attr('transform', 'rotate(-90)')
            //     .attr('y', 6)
            //     .attr('dy', '.71em')
            //     .style('text-anchor', 'end')
            //     .text('Value ($)');

            // svg.append('g')
            //     .attr('class', 'x axis')
            //     .attr('transform', 'translate(0,' + height + ')')
            //     .call(xAxis)
            //     .selectAll('text')
            //     .style('text-anchor', 'end')
            //     .attr('dx', '-.8em')
            //     .attr('dy', '-.55em')
            //     .attr('transform', 'rotate(-90)' );

        },

        _drawConstantObjects: function(){

            var $svg = $(this._viz.svg);
            $svg.empty();
            
            var graphWidth = $svg.width()
            var graphHeight = $svg.height();
            var graph = this._viz.svg;

            var color = d3.scaleOrdinal(d3.schemeCategory10)

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
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

        },

        formatData: function(data) {
           
        },
 
        updateView: function(data, config) {
           
        },

        getInitialDataParams: function() {
            return {
                outputMode: SplunkVisualizationBase.ROW_MAJOR_OUTPUT_MODE,
                count: 10000
            };
        }
    });
});
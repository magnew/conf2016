var webpack = require('webpack');
var path = require('path');

module.exports = {
    entry: 'conf_bar',
    resolve: {
        root: [
            path.join(__dirname, 'src'),
        ]
    },
    output: {
        filename: 'visualization.js',
        libraryTarget: 'amd'
    },
    module: {
        
    },
    externals: [
        'vizapi/SplunkVisualizationBase',
        'vizapi/SplunkVisualizationUtils'
    ]
};
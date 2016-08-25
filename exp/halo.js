var _ = require('underscore');
var fs = require('fs');
var http = require('http');
var https = require('https');
var haloAPI = require("haloapi");
var shell = require('shelljs');
var rq = require('request-promise');

var MY_KEY = '5821a03312204c339f749f0d55073d1d';

var JAN_SEASON_ID = '2fcc20a0-53ff-4ffb-8f72-eebb2e419273';
var SLAYER_ID = '892189e9-d712-4bdb-afa7-1ccab43fbed4';

var thingsToExport = {
    makeRequest: function (endPoint) {
        var host = 'https://www.haloapi.com';
       
        var url = host + endPoint;
        var options = {
            url: url,
            headers: {
                'Ocp-Apim-Subscription-Key': MY_KEY,
            },
            gzip: true,
            json: true,
        };

        console.log('Requesting ', url);
        
        return rq.get(options)
            .catch(function(error){
                console.log('error', error);
            });
    },
    getRanks: function (options) {
        console.log('Getting ranks');
        var that = this;
        return this.makeRequest('/stats/h5/player-leaderboards/csr/' + options.season + '/' + options.mode + '?' + 'count=100')
            .then(function (data) {
                that.writeToDataFile('ranks.json', data)
            }); 
    },
    getMatches: function (options) {
        console.log('Getting matches for', options.player);  
        var that = this;
        return this.makeRequest('/stats/h5/players/' + options.player + '/matches?modes=arena&count=25')
            .then(function (data) {
                that.writeToDataFile(options.player + 'Matches.json', data);
            });
    },
    getMatchByID: function (options) {
        console.log('Getting match', options.id);  
        var that = this;
        return this.makeRequest('/stats/h5/matches/' + options.id + '/events')
            .then(function (data) {
                that.writeToDataFile(options.id + '.json', data);
            });
    },
    useAPI: function (scrapeWhat) {
        var that = this;
        var api = new haloAPI(MY_KEY);

        
        api.stats.playerMatches('synonym0')
            .then(_.bind(function (data){
                this.writeToDataFile('testfile', data)
                console.log('data', _.pluck(data.Results, 'Id'));
                api.stats.events('5e89542d-8e4c-4183-a18e-18610293399f').then(console.log) 
            }, this));

        if(_.contains(scrapeWhat, 'seasons')){
            console.log('Fetching seasons');
            api.metadata.seasons()
                .then(function (data){
                    that.writeToDataFile('seasons.json', data);
                });
        }
        
    },
    writeToDataFile: function (fileName, jsonData) {
        fs.writeFile('data/' + fileName, JSON.stringify(jsonData));
    }
};

module.exports = thingsToExport;

// thingsToExport.getRanks({season: JAN_SEASON_ID, mode: SLAYER_ID});
// thingsToExport.getMatches({player: 'synonym0'});
thingsToExport.getMatchByID({id: '5e89542d-8e4c-4183-a18e-18610293399f'});
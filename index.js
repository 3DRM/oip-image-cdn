var express = require("express");
var fs = require("fs");

var ThumbnailScraper = require("./ThumbnailScraper.js");

var app = express();

var port = 9548;

app.get('/', function(req, res){ res.send("Online!") });

app.get('/artifact/:txid', function(req, res){
	var txid = req.params.txid;
	var filename = __dirname + "/thumbnails/" + txid + '.png';

	fs.stat(filename, function(err, stat) {
		if(err == null) {
			res.type('png');
			res.sendFile(filename);
		} else if(err.code == 'ENOENT') {
			// file does not exist
			ThumbnailScraper.getThumbnail(txid, function(){
				res.type('png');
				res.sendFile(filename);
			}, function(error){
				console.error(error);
				res.send("ERROR!!");
			})
		} else {
			console.log('Some other error: ', err.code);
		}
	});
});

app.listen(port, function(){
	console.log("App started on port: " + port);
})
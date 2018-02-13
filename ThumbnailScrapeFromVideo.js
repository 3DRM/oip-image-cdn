ThumbnailScraper.getThumbnailFromFiles = function(artifact, onSuccess, onError){
	console.log("Get Thumbnail From Files");

	var files = OIPJS.Artifact.getFiles(artifact);
	var location = OIPJS.Artifact.getLocation(artifact);

	var bestFile, matchFound = false;

	for (var file of files){
		if (OIPJS.util.getExtension(file.fname) === "mp4" && !matchFound){
			matchFound = true;
			bestFile = file;
		}
	}

	if (bestFile) {
		console.log("Downloading Video!");
		OIPJS.Network.ipfsUploadAPI.files.cat(OIPJS.util.buildIPFSShortURL(location, bestFile), function(err, data){
			if (err) {
				onError(err);
				return;
			}

			console.log("Writing Video to disk");

			var filename = __dirname + "/tmp/" + artifact.txid + ".mp4";

			fs.writeFile(filename, data, function(err){
				if (err){
					onError(err);
				} else {
					console.log("Grabbing Thumbnail from Video!");

					var ffmpegThumbnail = ffmpeg(filename).on('error', function(err) {
						ThumbnailScraper.generateGeopattern(artifact.txid, onSuccess, onError);
					}).screenshots({
						folder: __dirname + "/thumbnails/",
						filename: artifact.txid + ".png",
						count: 1
					})

					var fileExistsYet = false, returnedYet = false;

					var fileCheckInt = setInterval(function(){
						fs.stat(filename, function(err, stat) {
							if (err == null) {
								var genThumb = __dirname + "/thumbnails/" + artifact.txid + ".png";
								var newThumb = __dirname + "/thumbnails/" + artifact.txid.substr(0,6) + ".png";

								clearInterval(fileCheckInt);

								sharp(genThumb)
									.resize(720, 480)
									.toFile(newThumb, function(err, info){
										if (err && !returnedYet){
											returnedYet = true;
											onError("Error writing thumbnail to disk!");
										} else {
											console.log("Thumbnail written successfully.");

											if (!returnedYet){
												returnedYet = true;
												onSuccess();
												fs.unlink(genThumb, function(err){});
												fs.unlink(filename, function(err){});
											}
										}
									})
							} 
						})
					}, 200)
				}
			})

			// sharp(data)
			// 	.resize(720, 480)
			// 	.toFile(__dirname + "/thumbnails/" + txid + ".png", function(err, info){
			// 		if (err){
			// 			onError("Error writing thumbnail to disk!");
			// 		} else {
			// 			console.log("Thumbnail written successfully.");
			// 			onSuccess();
			// 		}
			// 	})
			// ThumbnailScraper.generateGeopattern(artifact.txid, onSuccess, onError);
		})
	} else {
		ThumbnailScraper.generateGeopattern(artifact.txid, onSuccess, onError);
	}
}
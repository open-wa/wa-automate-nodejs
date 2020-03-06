// LISTS ALL STICKER PACKS AND SENDS A STICKER FOR EACH PACK
await Store.Chat.find('000000000000@c.us').then(async (chat) => {
	let prIdx = await Store.StickerPack.pageWithIndex(0);
	await Store.StickerPack.fetchAt(0);        
	if (Store.StickerPack._models.length == 0) {
		console.log('Could not fetch any sticker packs.');
	} else {
		await Store.StickerPack._pageFetchPromises[prIdx];
		console.log('Total Packages = '+Store.StickerPack._models.length);
		for (let PackageId = 0; PackageId <= (Store.StickerPack._models.length-1); PackageId++) {	
			console.log('Package = ' + Store.StickerPack._models[PackageId].__x_name);
			let packageSticker = Store.StickerPack.where({ name: Store.StickerPack._models[PackageId].__x_name})[0];
			console.log('Total Sticker in package = '+packageSticker.__x_stickers._models.length);
			let sendOne = true;
			for (let stickerId = 0; stickerId <= (packageSticker.__x_stickers._models.length - 1); stickerId++) {
				if ( (sendOne==true) && (stickerId==1) ) {
					sendOne = false;
					console.log(packageSticker.__x_stickers._models[stickerId].__x_clientUrl);
					await window.WAPI.sendSticker({
						sticker:{
							'mimeType':packageSticker.__x_stickers._models[stickerId].__x_mimetype,
							'type':'sticker',
							'url':packageSticker.__x_stickers._models[stickerId].__x_clientUrl,
							'mediaKey':packageSticker.__x_stickers._models[stickerId].__x_mediaKey,
							'filehash':packageSticker.__x_stickers._models[stickerId].__x_filehash,
							'uploadhash':packageSticker.__x_stickers._models[stickerId].__x_uploadhash
						},
						chatid:chat.__x_id._serialized
					});					
				}
			}
		}		
	}
});

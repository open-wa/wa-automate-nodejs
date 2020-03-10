// SEND IMAGEM AS STICKER
var imageBase64 = "UklGRqoFAABXRUJQVlA4WAoAAAAQAAAAPwAAPwAAQUxQSLECAAANoG1te9rG+iRTWElh1VNmhvuYy545Z8qioUC5NQVtSwM7siOf7aOImICXp6s248gmdZ97705NBpCMCODeXGX57IDVjHuGbDO4YJly0R+WVzLkPuT6on2ynBm/w7RGYLsbpazUp7r+psQRHRnZ+GSKic4biIz4NBP9B10D4P00eawfZ+CusTuaAMDjXWSNVmzl3D67K+A/OyNS+H60rFjYJNCG/4WWCFbc9bJaX/SQEsx+W4ogDnWVeg7RQ0jGDQEtOlPourU3HUHa62qRMI6UcRprNxUkfLgV5sB+oci4XXXMIAm6I1H8ebiUTu+muJ2T+kojY4rkTQyXna1iGp1vwqyeytQ5oTHSfF8ItfCUpvDAf6xWSxK3t7mIINWoQWNzepZCyVrruJj9+HVnxJGy1zFCvriabLdcGwSzgg67KyD1+7uC1Tq0E2lnZUjWOdGG6eHXOLB/HC0mkf9oCk4wz7fF0ZK3UUqv/wQDc36fjwU/0dK6a+xOBvOKmkKYk/OU/F7ltoS5u10jFPm9VKYNjdDB/PBwS63HDTuNOokogYqdUcx+HC8ka40MxFCzTsdL3mYhyW23OqFQ9UOOc35K5Z7rWz6BsmGbc3NyITVpVx9yQh0896wJ8nsyn43QHEPl+xt90WIynjOOoLbHBIF85Cv2f21aITNcnqw2K/ZSs9fKkHzFk9SuZgFe7zYN66wSUxm85nLVK0gSTt1PYaLKYWjQghTeS9WuICuGYmK9D5McWpazjvSvIKtV8GvRyX1MsFok5iKUXT1oLo38G7n1UCtB4cWDX4L0pYyCkYPSqxhxn8swKF8AMJQx1bMATGQ8QQRTKxBEQDaIBygylZ5CakK+XxzihUodLT9NcA1xY68qIz5oDFqCUQelRpkxJYTr5AVySNqOPRJAEBUgSNHCbABWUDgg0gIAAPAPAJ0BKkAAQAA+USSORaOiIREG7DgFBLOAaGILhGzWcB2eA55Tz/2iVnun5nOUbxQOzMc/2n3HezX6f9gT9W/Rd9dPoNfrkYVGLxANbcZmc1JWQ7ANDc7QkFIfjd4wEJhvUk+Kcb+0U3U7iTVqlRPY+GXtGcPEDu72nbwn/JsQzNii6EWsE+AA/v+Ayjj3ElehTAJO77+0PaA0Vjfx0CdnCN9AINa9RIQvciYPyCw7fRY49oYj4rzrP/hDkLr/ZsjCVnhs8B37Hi/CtBey4Ci/zw6w9B4XSjR+XUd/BYMzw1l9E/V7hp4dz1s4Md23K0SW17yZ81ww/r9GrAVcPIowhyQECKjBcUNvEM19J2H6wQHO9hfFnx+S7IVkFG9lOW801flDAKx3O2cdOO9SfrBTl01OjzyEf38VtzkYSmBqo3jLBLOpK+DHCcNT1FtSD/9dZ9R+YfKWz+5WJf2F8hYNxJNjqhcQE2kxU9PKOYng93eGH/HZ+/1il/uAp93JqgK/+PH/Sw7Nwjf9+2I01UdrrhGO8BoqApV5LKfA/APBbNQra7z7erj/6wutiV9uQ4sm1zy2iVrsbjBzM+rnXYY/yW6rXg/Q2UPTQH6CKF2wSTQlknImcnr3Ji/iJdatfnu5guojSVePc9N1h39sD+4xdTPeMk7Ut6CW4XTv2gBFDV+7XhOxjo5vAbp/9L7M1IsfOSQw4HBtHbApp2xnT+lF6yh//IYA/94KvHwoj6GyimLY/WhxFla/HbwKT64K2PSX35n/gqA9M/vWFda4DiQAjsa8Hv7e/FuZOMFVwMW/1JufoEoz45bQNE4T7Tta5Tto9sZngrIOuMufAsGMSy/7ZewF7d77X/9//qRwMFH1qZWG4FEp45blXT6CH6vNJU51nlIwqiKFf71R13qvgSbPviVYd3YoX++9v/vnldMrobGAXKsZrBngjBamwh0MNiAA";

await window.WAPI.sendImageAsSticker(imageBase64,'000000000000@c.us');

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
			await Store.StickerPack._models[PackageId].stickers.fetch();
			let packageSticker = Store.StickerPack.where({ name: Store.StickerPack._models[PackageId].__x_name})[0];
			console.log('Total Sticker in package = '+packageSticker.__x_stickers._models.length);
			let sendOne = true;
			for (let stickerId = 0; stickerId <= (packageSticker.__x_stickers._models.length - 1); stickerId++) {
				if ( (sendOne==true) && (stickerId==1) ) {
					sendOne = false;
					console.log(packageSticker.__x_stickers._models[stickerId].__x_clientUrl);
					await window.WAPI.sendSticker(packageSticker.__x_stickers._models[stickerId],chat.__x_id._serialized);
				}
			}
		}		
	}
});

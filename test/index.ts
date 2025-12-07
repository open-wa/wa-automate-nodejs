import { DecryptableMessage, decryptMedia } from "../dist/decrypt";
import mime from "mime-types";
import fs from "fs";
import crypto from "crypto";

async function test() {
  //The absolute minimum data required to decrypt a file. This expires after a while. Add your own data here.
  const message : DecryptableMessage = {
    clientUrl: undefined,
    deprecatedMms3Url: "https://mmg.whatsapp.net/d/f/AlsIPPj-XJ0-HiLnMCyRmZRVIJWqP-l6L5FBKt_ybcad.enc",
    filehash: "D7dVGaQfR4lPKdWydw8u1jL/UD5pd/twJN0V6/WhY6w=",
    mediaKey: "PSHnGhaGa0wFQT9XxU0YkPFGpnrKYKN6mhe98gWSy2g=",
    mimetype: "image/jpeg",
    size: 34273,
    type: "image"
  }
  const filename = `${Date.now()}.${mime.extension(message.mimetype)}`;
  const mediaData = await decryptMedia(message);
  //Now confirm hash

  let output_hash = crypto
    .createHash("sha256")
    .update(mediaData)
    .digest("base64");
  let hashValid = message.filehash == output_hash;
  console.log("Hash Validated:", hashValid);
  fs.writeFile(filename, mediaData, function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  });
}

test();

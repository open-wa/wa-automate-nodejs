/** Pinned resources are fetched only by the backend which needs them. */
export const resourceManifest = Object.freeze({
  canvaskitJs: Object.freeze({
    url: 'https://cdn.jsdelivr.net/npm/canvaskit-wasm@0.42.0/bin/canvaskit.js',
    sha256: '443777592179808354031cf411d8d43cac9f6b98d1227123c5c22d401b0fbf7f',
    bytes: 120877, filename: 'canvaskit.cjs', version: '0.42.0', license: 'BSD-3-Clause',
  }),
  canvaskitWasm: Object.freeze({
    url: 'https://cdn.jsdelivr.net/npm/canvaskit-wasm@0.42.0/bin/canvaskit.wasm',
    sha256: '25ebed8e60158c5854f8dc807b936daca21354f8bfb6a2231266b0a93812f301',
    bytes: 7317345, filename: 'canvaskit.wasm', version: '0.42.0', license: 'BSD-3-Clause',
  }),
  fontSans: Object.freeze({"url": "https://raw.githubusercontent.com/google/fonts/5e8a3ba899557829a76cfdac30fa512bda91d7ca/ofl/abeezee/ABeeZee-Regular.ttf", "sha256": "2901c8df256648cc2bb2e3afb381cb8d28e65ed3dbe11de20695ae4d5ffdeda9", "bytes": 46016, "filename": "sans.ttf", "family": "OpenWA Sans", "license": "OFL-1.1", "version": "5e8a3ba899557829a76cfdac30fa512bda91d7ca"}),
  fontSerif: Object.freeze({"url": "https://raw.githubusercontent.com/google/fonts/5e8a3ba899557829a76cfdac30fa512bda91d7ca/ofl/lora/Lora%5Bwght%5D.ttf", "sha256": "822a6621ccbe8d97d20ac88c1c41f5615c9c2c202eaa75f272cd452aac6475a7", "bytes": 212196, "filename": "serif.ttf", "family": "OpenWA Serif", "license": "OFL-1.1", "version": "5e8a3ba899557829a76cfdac30fa512bda91d7ca"}),
  fontMono: Object.freeze({"url": "https://raw.githubusercontent.com/google/fonts/5e8a3ba899557829a76cfdac30fa512bda91d7ca/ofl/ibmplexmono/IBMPlexMono-Regular.ttf", "sha256": "6a3412f058c7d8dfd9170c41e85ade48e5156ecb89356110ca57a0a27734af46", "bytes": 135580, "filename": "mono.ttf", "family": "OpenWA Mono", "license": "OFL-1.1", "version": "5e8a3ba899557829a76cfdac30fa512bda91d7ca"}),
  webpEncoderJs: Object.freeze({"url": "https://cdn.jsdelivr.net/npm/@jsquash/webp@1.5.0/codec/enc/webp_enc_simd.js", "sha256": "3038e60ebba6252baba08c691e31d1efe5036a185435daa7b4afaef3cc9273f9", "bytes": 38646, "filename": "webp-encoder.mjs", "version": "1.5.0", "license": "Apache-2.0 AND BSD-3-Clause"}),
  webpEncoderWasm: Object.freeze({"url": "https://cdn.jsdelivr.net/npm/@jsquash/webp@1.5.0/codec/enc/webp_enc_simd.wasm", "sha256": "39c279269ec1163b987b6d69749458e3d5b03b9585f58b6ca5455b76b504a305", "bytes": 345584, "filename": "webp-encoder.wasm", "version": "1.5.0", "license": "Apache-2.0 AND BSD-3-Clause"}),
});

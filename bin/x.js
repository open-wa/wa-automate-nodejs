const wa = require('../dist/build/build-postman');

async function _(){
    const xxx = await wa.generatePostmanJson();
    
    console.log("xxx", xxx)
}

_();
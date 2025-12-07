
console.log('x main', process.mainModule.path);
console.log('x main', require.main.path);
var fs = require('fs'),
    path = require('path');

var dirString = path.dirname(fs.realpathSync(__filename));

// output example: "/Users/jb/workspace/abtest"
console.log('directory to start walking...', dirString);
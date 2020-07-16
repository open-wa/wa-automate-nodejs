import * as readts from 'readts';

var parser = new readts.Parser();

// Read configuration used in the project we want to analyze.
var config = parser.parseConfig('./tsconfig.json');

// Modify configuration as needed, for example to avoid writing compiler output to disk.
config.options.noEmit = true;

// Parse the project.

var tree = parser.parse(config);
console.log("tree", tree);
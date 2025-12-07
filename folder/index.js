require('./subfolder/x')

console.log(process.mainModule.path);
console.log(require.main.path);
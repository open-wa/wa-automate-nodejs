const fs = require('fs');
const glob = require('glob');

const tsconfigs = glob.sync('**/tsconfig*.json', { ignore: '**/node_modules/**' });

for (let file of tsconfigs) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  content = content.replace(/\n\s*"baseUrl"\s*:\s*"[^"]*",?/g, '');
  content = content.replace(/\n\s*"ignoreDeprecations"\s*:\s*"[^"]*",?/g, '');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
}

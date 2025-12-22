// apps/docs/scripts/update-package-json.js
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../package.json');

// Read and parse existing package.json
let packageJson;
try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (error) {
    console.error('Error reading package.json:', error);
    process.exit(1);
}

// Add copy-openapi script to scripts
if (!packageJson.scripts) {
    packageJson.scripts = {};
}

packageJson.scripts['copy:openapi'] = 'node scripts/copy-openapi.js';

// Write back to file
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ Updated package.json with copy-openapi script');
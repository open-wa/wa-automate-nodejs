const fs = require('fs');
const path = require('path');

const responseFile = process.argv[2];

if (!responseFile) {
    console.error('Usage: node apply-patch.js <response_file>');
    process.exit(1);
}

const content = fs.readFileSync(responseFile, 'utf8');

// Regex to find XML-like file blocks
// Pattern: <file path="path/to/file.ext"> content </file>
const fileRegex = /<file\s+path=["']([^"']+)["']\s*>([\s\S]*?)<\/file>/g;

let match;
let count = 0;

while ((match = fileRegex.exec(content)) !== null) {
    const filePath = match[1];
    const fileContent = match[2];

    if (filePath && fileContent) {
        // Normalize path
        const normalizedPath = filePath.replace(/\\/g, '/');

        console.log(`Applying patch to: ${normalizedPath}`);

        // Ensure directory exists
        const dir = path.dirname(normalizedPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Trim leading/trailing whitespace from the content if needed, 
        // but be careful not to strip essential indentation.
        // Usually, XML tags might leave a newline at start/end.
        // Let's trim the very first newline if present and very last.
        const cleanContent = fileContent.replace(/^\n/, '').replace(/\n$/, '');

        fs.writeFileSync(normalizedPath, cleanContent);
        count++;
    }
}

if (count === 0) {
    console.log('No <file> tags found in response. Checking for legacy markdown format...');
    // Fallback to simpler regex or just warn
    console.warn('Warning: No file blocks applied.');
} else {
    console.log(`Successfully applied ${count} files.`);
}

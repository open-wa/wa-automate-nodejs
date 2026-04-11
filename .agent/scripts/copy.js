#!/usr/bin/env node
/**
 * Agent Clipboard Copy Helper
 * Cross-platform clipboard copy utility for AI agents
 */

const { spawn } = require('child_process');
const os = require('os');

function copyToClipboard(content) {
    return new Promise((resolve, reject) => {
        const platform = os.platform();
        let cmd, args;

        if (platform === 'darwin') {
            // macOS
            cmd = 'pbcopy';
            args = [];
        } else if (platform === 'win32') {
            // Windows
            cmd = 'clip';
            args = [];
        } else if (platform === 'linux') {
            // Linux - try xclip first
            cmd = 'xclip';
            args = ['-selection', 'clipboard'];
        } else {
            return reject(new Error(`Unsupported platform: ${platform}`));
        }

        const proc = spawn(cmd, args);

        proc.stdin.write(content);
        proc.stdin.end();

        proc.on('close', (code) => {
            if (code === 0) {
                resolve(true);
            } else {
                reject(new Error(`Clipboard command exited with code ${code}`));
            }
        });

        proc.on('error', (err) => {
            // If xclip fails on Linux, try xsel
            if (platform === 'linux' && cmd === 'xclip') {
                const xselProc = spawn('xsel', ['--clipboard']);
                xselProc.stdin.write(content);
                xselProc.stdin.end();

                xselProc.on('close', (code) => {
                    if (code === 0) {
                        resolve(true);
                    } else {
                        reject(new Error('Both xclip and xsel failed'));
                    }
                });

                xselProc.on('error', () => {
                    reject(new Error('No clipboard utility found (install xclip or xsel)'));
                });
            } else {
                reject(err);
            }
        });
    });
}

async function main() {
    let content;

    // Check if content is passed as argument
    if (process.argv[2]) {
        content = process.argv.slice(2).join(' ');
    }
    // Otherwise read from stdin
    else if (!process.stdin.isTTY) {
        const chunks = [];
        for await (const chunk of process.stdin) {
            chunks.push(chunk);
        }
        content = Buffer.concat(chunks).toString('utf8');
    }
    else {
        console.error('❌ No content provided');
        process.exit(1);
    }

    try {
        await copyToClipboard(content);
        console.log('✅ Content copied to clipboard!');
    } catch (err) {
        console.error('❌ Failed to copy to clipboard:', err.message);
        process.exit(1);
    }
}

main();

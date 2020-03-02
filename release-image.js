"use strict";
/**
 * @license
 * Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
Object.defineProperty(exports, "__esModule", { value: true });
const parseChangelog = require("changelog-parser");
const commandLineArgs = require("command-line-args");
const marked = require("marked");
const puppeteer = require("puppeteer");
const fs = require("fs");
const util = require("util");
const path = require("path");
const readFile = util.promisify(fs.readFile);
const optionDefinitions = [
    { name: 'file', type: String, defaultOption: true },
    { name: 'version', type: String },
];
const stripMarkdown = (text) => {
    var str = String(text).replace(/__|\*|\#|(?:\[([^\]]*)\]\([^)]*\))/gm, '$1');
    return str;
};
exports.run = async () => {
    const options = commandLineArgs(optionDefinitions);
    const filename = options.file || 'CHANGELOG.md';
    const version = options.version;
    const packageJson = JSON.parse(await readFile(path.join(path.dirname(filename), 'package.json'), { encoding: 'utf-8' }));
    const packageName = packageJson.name;
    console.log(`Reading ${packageName} release ${version} from ${filename}`);
    const changelog = (await parseChangelog({
        filePath: filename,
        removeMarkdown: true,
    }));
    const release = await getRelease(changelog, version);
    if (release === undefined) {
        throw new Error('no release found');
    }
    const body = marked(release.body);
    // colors taken from https://github.com/dracula/dracula-theme
    const html = `
    <!doctype html>
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css?family=Open+Sans:300,400|Roboto+Mono:300|Roboto+Slab:400,700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Open Sans', sans-serif;
            font-weight: 300;
            background: #282a36;
            color: #f8f8f2;
            margin: 1.5em;
          }
          h1, h2, h3 {
            font-family: 'Roboto Slab', serif;
            color: #ff79c6;
            font-weight: 400;
          }
          span.name {
            color: #8be9fd;
          }
          code {
            font-family: 'Roboto Mono', monospace;
            font-size: 14px;
            background: #44475a;
            border-radius: 3px;
            padding: 0 4px;
          }
          a {
            color: inherit;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <h2><span class="name">${packageName}</span> ${stripMarkdown(release.title)}</h2>
        ${body}
      </body>
    </html>
  `;
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 800, deviceScaleFactor: 2 });
    await page.setContent(html);
    await page.evaluate(`document.fonts.ready`);
    const bounds = await page.evaluate(`
    document.documentElement.getBoundingClientRect().toJSON()
  `);
    await page.screenshot({
        path: 'release.png',
        encoding: 'binary',
        type: 'png',
        clip: {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
        },
    });
    console.log('Wrote screenshot to release.png');
    await browser.close();
    process.exit();
};
const latestVersion = {};
const getRelease = async (changelog, version = latestVersion) => {
    return changelog.versions.find((r) => (r.version !== null && version === latestVersion) ||
        r.version === version ||
        (r.version === null && version === undefined));
};
exports.run();

import fs from "fs";
import { globSync } from "glob";
import path from "path";
import swc from "@rollup/plugin-swc";

import packageJson from "./package.json" with { type: "json" };

const allNodeTypes = Object.keys(packageJson["node-red"].nodes);

const htmlWatch = () => {
  return {
    name: "htmlWatch",
    load(id) {
      const editorDir = path.dirname(id);
      const htmlFiles = globSync(path.join(editorDir, "*.html"));
      htmlFiles.map((file) => this.addWatchFile(file));
    },
  };
};

const htmlBundle = () => {
  return {
    name: "htmlBundle",
    renderChunk(code, chunk, _options) {
      const editorDir = path.dirname(chunk.facadeModuleId);
      const htmlFiles = globSync(path.join(editorDir, "*.html"));
      const htmlContents = htmlFiles.map((fPath) => fs.readFileSync(fPath));

      code =
        '<script type="text/javascript">\n' +
        code +
        "\n" +
        "</script>\n" +
        htmlContents.join("\n");

      return {
        code,
        map: { mappings: "" },
      };
    },
  };
};

const makePlugins = (nodeType) => [
  htmlWatch(),
  swc({
    include: [
      `src/nodes/${nodeType}/${nodeType}.html/**/*.ts`,
      `src/nodes/${nodeType}/shared/**/*.ts`,
      "src/nodes/shared/common.ts",
    ],
    swc: {
      jsc: {
        parser: { syntax: "typescript" },
        target: "es5",
      },
    },
  }),
  htmlBundle(),
];

const makeConfigItem = (nodeType) => ({
  input: `src/nodes/${nodeType}/${nodeType}.html/index.ts`,
  output: {
    file: `dist/nodes/${nodeType}/${nodeType}.html`,
    format: "iife",
    globals: {
    }
  },
  plugins: makePlugins(nodeType),
  watch: {
    clearScreen: false,
  },
  external: [
    /^@open-wa\//,
  ]
});

export default allNodeTypes.map((nodeType) => makeConfigItem(nodeType));

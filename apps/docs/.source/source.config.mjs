// source.config.ts
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import {
  remarkAutoTypeTable,
  createGenerator,
  createFileSystemGeneratorCache
} from "fumadocs-typescript";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { visit } from "unist-util-visit";
var currentDir = path.dirname(fileURLToPath(import.meta.url));
var methodsMapPath = path.resolve(currentDir, "content/docs/reference/client/methods-map.json");
var methodsMap = {};
try {
  if (fs.existsSync(methodsMapPath)) {
    methodsMap = JSON.parse(fs.readFileSync(methodsMapPath, "utf8"));
  }
} catch (e) {
  console.error("Failed to load methods-map.json", e);
}
var STATIC_MAPPINGS = {
  "Client": "/docs/reference/client/client",
  "ConfigObject": "/docs/guides/config-schema",
  "Message": "/docs/reference/client/messages",
  "SimpleListener": "/docs/reference/client/client",
  "GroupMetadata": "/docs/reference/client/groups",
  "onAck": "/docs/reference/client/messages#onack",
  "onMessage": "/docs/reference/client/messages#onmessage",
  "onAnyMessage": "/docs/reference/client/messages#onanymessage"
};
function resolveLink(entity) {
  if (STATIC_MAPPINGS[entity]) {
    return STATIC_MAPPINGS[entity];
  }
  if (entity.startsWith("ConfigObject.")) {
    const field = entity.split(".")[1];
    return `/docs/guides/config-schema#${field.toLowerCase()}`;
  }
  if (methodsMap[entity]) {
    return methodsMap[entity];
  }
  const foundKey = Object.keys(methodsMap).find((k) => k.toLowerCase() === entity.toLowerCase());
  if (foundKey) {
    return methodsMap[foundKey];
  }
  return null;
}
function remarkBracketLinks() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.children && Array.isArray(node.children)) {
        const children = node.children;
        for (let i = 0; i < children.length - 2; i++) {
          const node1 = children[i];
          const node2 = children[i + 1];
          const node3 = children[i + 2];
          if (node1.type === "text" && node1.value.endsWith("[[") && node2.type === "inlineCode" && node3.type === "text" && node3.value.startsWith("]]")) {
            node1.value = node1.value.slice(0, -2);
            node3.value = node3.value.slice(2);
            const entity = node2.value;
            const url = resolveLink(entity);
            if (url) {
              children[i + 1] = {
                type: "link",
                url,
                title: null,
                children: [node2]
              };
            }
          }
        }
      }
    });
    visit(tree, "text", (node, index, parent) => {
      if (!parent || index === void 0) return;
      const text = node.value;
      const doubleRegex = /\[\[([a-zA-Z0-9_\.]+)\]\]/g;
      if (doubleRegex.test(text)) {
        doubleRegex.lastIndex = 0;
        const newNodes = [];
        let lastIndex = 0;
        let match;
        while ((match = doubleRegex.exec(text)) !== null) {
          const matchIndex = match.index;
          const entity = match[1];
          if (matchIndex > lastIndex) {
            newNodes.push({
              type: "text",
              value: text.slice(lastIndex, matchIndex)
            });
          }
          const url = resolveLink(entity);
          if (url) {
            newNodes.push({
              type: "link",
              url,
              title: null,
              children: [
                {
                  type: "inlineCode",
                  value: entity
                }
              ]
            });
          } else {
            newNodes.push({
              type: "inlineCode",
              value: entity
            });
          }
          lastIndex = doubleRegex.lastIndex;
        }
        if (lastIndex < text.length) {
          newNodes.push({
            type: "text",
            value: text.slice(lastIndex)
          });
        }
        parent.children.splice(index, 1, ...newNodes);
        return index + newNodes.length;
      }
      const singleRegex = /\[([a-zA-Z0-9_\.]+)\]/g;
      if (singleRegex.test(text)) {
        singleRegex.lastIndex = 0;
        const newNodes = [];
        let lastIndex = 0;
        let match;
        let hasResolved = false;
        while ((match = singleRegex.exec(text)) !== null) {
          const matchIndex = match.index;
          const entity = match[1];
          const url = resolveLink(entity);
          if (url) {
            hasResolved = true;
            if (matchIndex > lastIndex) {
              newNodes.push({
                type: "text",
                value: text.slice(lastIndex, matchIndex)
              });
            }
            newNodes.push({
              type: "link",
              url,
              title: null,
              children: [
                {
                  type: "text",
                  value: entity
                }
              ]
            });
            lastIndex = singleRegex.lastIndex;
          }
        }
        if (hasResolved) {
          if (lastIndex < text.length) {
            newNodes.push({
              type: "text",
              value: text.slice(lastIndex)
            });
          }
          parent.children.splice(index, 1, ...newNodes);
          return index + newNodes.length;
        }
      }
    });
    visit(tree, "linkReference", (node) => {
      const label = node.label || node.identifier;
      if (label) {
        const url = resolveLink(label);
        if (url) {
          node.type = "link";
          node.url = url;
          node.title = null;
        }
      }
    });
  };
}
var generator = createGenerator({
  cache: createFileSystemGeneratorCache(".fumadocs-typescript"),
  tsconfigPath: "./tsconfig.json"
});
var docs = defineDocs({
  dir: "content/docs",
  docs: {
    postprocess: {
      includeProcessedMarkdown: true
    }
  }
});
var source_config_default = defineConfig({
  mdxOptions: {
    remarkPlugins: (defaults) => [
      ...defaults,
      remarkBracketLinks,
      [remarkAutoTypeTable, {
        name: "AutoTypeTable",
        generator
      }]
    ]
  }
});
export {
  source_config_default as default,
  docs
};

// source.config.ts
import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import {
  remarkAutoTypeTable,
  createGenerator,
  createFileSystemGeneratorCache
} from "fumadocs-typescript";
var generator = createGenerator({
  cache: createFileSystemGeneratorCache(".fumadocs-typescript"),
  tsconfigPath: "./tsconfig.json"
});
var docs = defineDocs({
  dir: "content/docs"
});
var source_config_default = defineConfig({
  mdxOptions: {
    remarkPlugins: (defaults) => [
      ...defaults,
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

// "Harbour" Shiki theme: deep ocean panel, sand strings, terracotta keywords.
export const harbour = {
  name: "harbour",
  type: "dark" as const,
  colors: { "editor.background": "#0b2d43", "editor.foreground": "#eef3f6" },
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#a9bfcd", fontStyle: "italic" } },
    { scope: ["string", "string.quoted", "string.template", "punctuation.definition.string"], settings: { foreground: "#f1d9a8" } },
    { scope: ["keyword", "storage", "storage.type", "storage.modifier", "keyword.control", "keyword.operator.new", "keyword.operator.expression"], settings: { foreground: "#ff9f86" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call entity.name.function"], settings: { foreground: "#9fd8ea" } },
    { scope: ["constant.numeric", "constant.language", "constant.language.boolean"], settings: { foreground: "#ffc7a3" } },
    { scope: ["variable.other.property", "meta.object-literal.key", "support.type.property-name", "support.type.property-name.json"], settings: { foreground: "#d5e4ec" } },
    { scope: ["entity.name.type", "support.class", "entity.name.class", "variable.other.constant.object"], settings: { foreground: "#9fd8ea" } },
    { scope: ["variable.parameter", "variable.other.readwrite", "variable"], settings: { foreground: "#eef3f6" } },
    { scope: ["punctuation", "meta.brace", "keyword.operator"], settings: { foreground: "#bccbd6" } },
    { scope: ["entity.name.tag", "support.function.builtin.shell", "entity.name.command"], settings: { foreground: "#ff9f86" } },
    { scope: ["variable.parameter.option", "constant.other.option"], settings: { foreground: "#ffc7a3" } },
  ],
};

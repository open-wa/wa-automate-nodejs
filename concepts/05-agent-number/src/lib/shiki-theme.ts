// Warm ink code theme for Shiki (build time only). Colours mirror tokens.css.
export const inkTheme = {
  name: "agent-ink",
  type: "dark",
  colors: { "editor.background": "#1f1d1a", "editor.foreground": "#ece4d6" },
  settings: [
    { settings: { foreground: "#ece4d6", background: "#1f1d1a" } },
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#9a9083", fontStyle: "italic" } },
    { scope: ["keyword", "storage", "storage.type", "keyword.control", "keyword.operator.new", "variable.language"], settings: { foreground: "#e9a3ab" } },
    { scope: ["string", "string.quoted", "punctuation.definition.string"], settings: { foreground: "#cfcf8f" } },
    { scope: ["constant.numeric", "constant.language", "constant.other"], settings: { foreground: "#f0b98a" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call entity.name.function"], settings: { foreground: "#f6dcae" } },
    { scope: ["support.type.property-name", "meta.object-literal.key", "support.type.property-name.json"], settings: { foreground: "#d9c6f0" } },
    { scope: ["entity.name.type", "support.class", "entity.name.class"], settings: { foreground: "#f6dcae" } },
    { scope: ["variable.parameter", "variable.other.readwrite.alias"], settings: { foreground: "#ece4d6" } },
    { scope: ["punctuation", "meta.brace"], settings: { foreground: "#b8ad9c" } },
    { scope: ["variable.other.env", "variable.other.normal.shell", "entity.name.command"], settings: { foreground: "#f6dcae" } },
  ],
};

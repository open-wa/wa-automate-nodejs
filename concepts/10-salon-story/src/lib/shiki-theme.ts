// A Shiki theme in the salon palette: espresso ground, cream text, brass
// keywords, blush strings. Contrast checked against #2b1b17.
export const salonTheme = {
  name: "salon-espresso",
  type: "dark",
  colors: { "editor.background": "#2b1b17", "editor.foreground": "#f6e7e1" },
  settings: [
    { settings: { foreground: "#f6e7e1", background: "#2b1b17" } },
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#b39b92", fontStyle: "italic" } },
    { scope: ["keyword", "storage", "storage.type", "keyword.control", "keyword.operator.new", "keyword.operator.expression"], settings: { foreground: "#e2b56f" } },
    { scope: ["string", "string.quoted", "string.template", "punctuation.definition.string"], settings: { foreground: "#f4b9ab" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call entity.name.function"], settings: { foreground: "#f9d9a8" } },
    { scope: ["variable.parameter", "variable.other.readwrite", "variable.other.object"], settings: { foreground: "#f6e7e1" } },
    { scope: ["constant.numeric", "constant.language", "support.constant"], settings: { foreground: "#e9a58a" } },
    { scope: ["string.regexp"], settings: { foreground: "#e7c08a" } },
    { scope: ["support.type.property-name", "meta.object-literal.key", "variable.other.property"], settings: { foreground: "#ecd0c6" } },
    { scope: ["punctuation", "meta.brace"], settings: { foreground: "#d8c0b7" } },
    { scope: ["entity.name.tag", "support.class", "entity.name.type"], settings: { foreground: "#e2b56f" } },
    { scope: ["variable.parameter.option", "constant.other.option"], settings: { foreground: "#e2b56f" } },
  ],
} as const;

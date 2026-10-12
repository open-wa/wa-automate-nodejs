// Syntax colours for code panels: cream text on deep plum, tangerine keywords.
export const theme = {
  name: "business-line",
  type: "dark" as const,
  colors: { "editor.background": "#1C0820", "editor.foreground": "#FFF4E6" },
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#BFA3BC", fontStyle: "italic" } },
    { scope: ["keyword", "storage", "storage.type", "keyword.control", "keyword.operator.new", "variable.language"], settings: { foreground: "#FF9A4D" } },
    { scope: ["string", "string.quoted", "string.template", "punctuation.definition.string"], settings: { foreground: "#FFD6A8" } },
    { scope: ["constant.numeric", "constant.language", "constant.other"], settings: { foreground: "#FF9EC0" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call entity.name.function"], settings: { foreground: "#FFC46B" } },
    { scope: ["variable.parameter", "meta.parameters"], settings: { foreground: "#F4D9EF" } },
    { scope: ["support.type.property-name", "meta.object-literal.key", "entity.name.tag"], settings: { foreground: "#F7B8E4" } },
    { scope: ["entity.name.type", "support.class", "entity.name.class"], settings: { foreground: "#FFC46B" } },
    { scope: ["punctuation", "meta.brace", "keyword.operator"], settings: { foreground: "#E8CFE2" } },
    { scope: ["variable.other.constant"], settings: { foreground: "#FFF4E6" } },
  ],
};

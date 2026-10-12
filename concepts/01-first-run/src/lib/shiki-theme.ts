// Syntax colours from the brand tokens: amber for keywords, a warm tint for
// strings, bone for names, grey for comments and punctuation, the status
// colour for numbers and literals.
export const phosphor = {
  name: "phosphor",
  type: "dark",
  colors: { "editor.background": "#151612", "editor.foreground": "#EDE8DC" },
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#9A968A", fontStyle: "italic" } },
    { scope: ["keyword", "storage", "storage.type", "storage.modifier", "keyword.control", "keyword.operator.new", "keyword.operator.expression"], settings: { foreground: "#FFB000" } },
    { scope: ["string", "string.quoted", "string.template", "punctuation.definition.string"], settings: { foreground: "#FFD27A" } },
    { scope: ["constant.numeric", "constant.language", "constant.language.boolean", "support.constant"], settings: { foreground: "#C3EA5C" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call entity.name.function"], settings: { foreground: "#EDE8DC" } },
    { scope: ["variable", "variable.other", "variable.parameter", "meta.object-literal.key", "support.type.property-name"], settings: { foreground: "#EDE8DC" } },
    { scope: ["support.type.property-name.json", "meta.object-literal.key", "variable.other.property"], settings: { foreground: "#F3E3BF" } },
    { scope: ["entity.name.type", "entity.name.class", "support.class", "support.type"], settings: { foreground: "#FFB000" } },
    { scope: ["punctuation", "meta.brace", "keyword.operator"], settings: { foreground: "#9A968A" } },
    { scope: ["variable.parameter.shell", "entity.name.command", "support.function.builtin.shell"], settings: { foreground: "#FFB000" } },
    { scope: ["variable.other.normal.shell", "variable.other.assignment.shell"], settings: { foreground: "#C3EA5C" } },
  ],
};

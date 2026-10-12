// A Shiki theme in 07's palette: slate panel, sun-yellow strings, cool blue
// keywords. Used by CodeBlock through Astro's built-in <Code>.
export const slateSun = {
  name: "slate-sun",
  type: "dark" as const,
  colors: { "editor.background": "#1e2a38", "editor.foreground": "#e8edf3" },
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#93a3b6", fontStyle: "italic" } },
    { scope: ["string", "string.quoted", "string.template", "punctuation.definition.string"], settings: { foreground: "#ffd23f" } },
    { scope: ["keyword", "storage", "storage.type", "storage.modifier", "keyword.control", "keyword.operator.new", "keyword.operator.expression"], settings: { foreground: "#9cc4ff" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call entity.name.function"], settings: { foreground: "#ffe9a3" } },
    { scope: ["constant.numeric", "constant.language", "constant.language.boolean"], settings: { foreground: "#ffb58a" } },
    { scope: ["variable.other.property", "meta.object-literal.key", "support.type.property-name", "support.type.property-name.json"], settings: { foreground: "#c9d7e8" } },
    { scope: ["entity.name.type", "support.class", "entity.name.class", "variable.other.constant.object"], settings: { foreground: "#ffe9a3" } },
    { scope: ["variable.parameter", "variable.other.readwrite", "variable"], settings: { foreground: "#e8edf3" } },
    { scope: ["punctuation", "meta.brace", "keyword.operator"], settings: { foreground: "#b8c5d4" } },
    { scope: ["entity.name.tag", "support.function.builtin.shell", "entity.name.command"], settings: { foreground: "#9cc4ff" } },
    { scope: ["variable.parameter.option", "constant.other.option"], settings: { foreground: "#ffb58a" } },
  ],
};

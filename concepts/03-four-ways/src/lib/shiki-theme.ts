// A Shiki theme in the concept's palette: navy panel, warm white text, coral
// keywords, brass strings. Every token colour clears 4.5:1 on the panel.
export const theme = {
  name: "four-ways-navy",
  type: "dark",
  colors: { "editor.background": "#14213D", "editor.foreground": "#F4F1EA" },
  tokenColors: [
    { settings: { foreground: "#F4F1EA" } },
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#9AA6BF", fontStyle: "italic" } },
    { scope: ["keyword", "storage", "storage.type", "storage.modifier", "keyword.control", "keyword.operator.new", "keyword.operator.expression"], settings: { foreground: "#FF8F73" } },
    { scope: ["string", "string.quoted", "string.template", "punctuation.definition.string"], settings: { foreground: "#E3C27E" } },
    { scope: ["constant.numeric", "constant.language", "constant.other"], settings: { foreground: "#FFB59E" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call entity.name.function"], settings: { foreground: "#B9D3F0" } },
    { scope: ["variable.other.object", "entity.name.type", "support.class", "entity.name.class", "support.type.property-name", "meta.object-literal.key"], settings: { foreground: "#C9D8EC" } },
    { scope: ["punctuation", "meta.brace", "keyword.operator"], settings: { foreground: "#C4CAD6" } },
    { scope: ["variable.parameter"], settings: { foreground: "#F4F1EA", fontStyle: "italic" } },
    { scope: ["entity.name.tag", "support.type.property-name.json"], settings: { foreground: "#B9D3F0" } },
  ],
};

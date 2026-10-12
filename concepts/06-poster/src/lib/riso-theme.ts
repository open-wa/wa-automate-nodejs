// Shiki theme printed in the poster's inks, on a second sheet of newsprint.
// Every token colour holds 4.5:1 or better against the panel background.
export const risoTheme = {
  name: "riso-newsprint",
  type: "light",
  colors: { "editor.background": "#E8E2D2", "editor.foreground": "#1C1A2E" },
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#5C5768", fontStyle: "italic" } },
    { scope: ["keyword", "storage", "storage.type", "keyword.control", "keyword.operator.new", "keyword.operator.expression"], settings: { foreground: "#AE1066" } },
    { scope: ["string", "string.quoted", "punctuation.definition.string", "string.template"], settings: { foreground: "#00598D" } },
    { scope: ["constant.numeric", "constant.language", "support.constant"], settings: { foreground: "#8A1A92" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call entity.name.function"], settings: { foreground: "#1C1A2E", fontStyle: "bold" } },
    { scope: ["variable.other.object", "variable.other.constant", "entity.name.type", "support.class", "entity.name.class"], settings: { foreground: "#004F7C" } },
    { scope: ["support.type.property-name", "meta.object-literal.key", "entity.name.tag"], settings: { foreground: "#7A2E00" } },
    { scope: ["variable.parameter", "variable"], settings: { foreground: "#1C1A2E" } },
    { scope: ["punctuation", "meta.brace"], settings: { foreground: "#4A4658" } },
  ],
};

// A Shiki theme in this concept's palette: navy ground, red keywords, warm strings.
export const theme = {
  name: "switchboard",
  type: "dark",
  colors: { "editor.background": "#0E1530", "editor.foreground": "#E6E3DA" },
  tokenColors: [
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#8A93B0", fontStyle: "italic" } },
    { scope: ["keyword", "storage", "storage.type", "keyword.operator.new", "keyword.control"], settings: { foreground: "#FF6F61" } },
    { scope: ["string", "string.quoted", "punctuation.definition.string"], settings: { foreground: "#F7C6A3" } },
    { scope: ["constant.numeric", "constant.language", "constant.other"], settings: { foreground: "#FFB4A8" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call", "variable.function"], settings: { foreground: "#9DBBFF" } },
    { scope: ["variable", "variable.other", "variable.parameter"], settings: { foreground: "#E6E3DA" } },
    { scope: ["variable.other.property", "support.type.property-name", "meta.object-literal.key", "entity.name.tag"], settings: { foreground: "#C9D2EE" } },
    { scope: ["support.class", "entity.name.type", "entity.name.class"], settings: { foreground: "#FFD08A" } },
    { scope: ["keyword.operator", "punctuation"], settings: { foreground: "#AEB6CF" } },
    { scope: ["variable.other.php", "punctuation.definition.variable.php"], settings: { foreground: "#FFD08A" } },
  ],
};

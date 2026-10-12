/** Shiki theme for 09: charcoal panels, the four job swatches lifted for contrast on dark. */
export const recipeInk = {
  name: "recipe-ink",
  type: "dark",
  colors: { "editor.background": "#1C1C1C", "editor.foreground": "#EDEDE6" },
  settings: [
    { settings: { foreground: "#EDEDE6", background: "#1C1C1C" } },
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#9A9A90", fontStyle: "italic" } },
    { scope: ["string", "string.quoted", "string.template", "punctuation.definition.string"], settings: { foreground: "#F5C16E" } },
    { scope: ["constant.numeric", "constant.language", "constant.character"], settings: { foreground: "#FF8A73" } },
    { scope: ["keyword", "storage", "storage.type", "storage.modifier", "keyword.control", "keyword.operator.new"], settings: { foreground: "#B9A2F0" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call entity.name.function"], settings: { foreground: "#7DB8F0" } },
    { scope: ["variable.parameter", "variable.other.readwrite", "variable"], settings: { foreground: "#EDEDE6" } },
    { scope: ["support.type.property-name", "meta.object-literal.key", "entity.name.tag"], settings: { foreground: "#F2D4A0" } },
    { scope: ["entity.name.type", "support.class", "entity.name.class"], settings: { foreground: "#FF8A73" } },
    { scope: ["punctuation", "meta.brace", "keyword.operator"], settings: { foreground: "#BDBDB3" } },
    { scope: ["string.regexp"], settings: { foreground: "#FF8A73" } },
    { scope: ["source.shell variable.other", "variable.other.normal.shell"], settings: { foreground: "#7DB8F0" } },
    { scope: ["entity.name.command", "support.function.builtin.shell"], settings: { foreground: "#7DB8F0" } },
  ],
};

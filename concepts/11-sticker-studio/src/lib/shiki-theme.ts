/** Code colours in the studio palette: ink panel, yellow strings, lilac keywords. */
export const stickerTheme = {
  name: "sticker-ink",
  type: "dark",
  colors: { "editor.background": "#111111", "editor.foreground": "#f4f0ff" },
  settings: [
    { settings: { foreground: "#f4f0ff", background: "#111111" } },
    { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: "#a99fc4", fontStyle: "italic" } },
    { scope: ["string", "string.quoted", "string.template", "punctuation.definition.string"], settings: { foreground: "#ffe600" } },
    { scope: ["keyword", "storage", "storage.type", "keyword.control", "keyword.operator.new", "variable.language"], settings: { foreground: "#c9b8ff" } },
    { scope: ["constant.numeric", "constant.language", "constant.character"], settings: { foreground: "#ff8fc7" } },
    { scope: ["entity.name.function", "support.function", "meta.function-call entity.name.function"], settings: { foreground: "#8ff0c9" } },
    { scope: ["variable.parameter", "meta.object-literal.key", "support.type.property-name", "entity.name.tag"], settings: { foreground: "#ffd2ea" } },
    { scope: ["entity.name.type", "support.class", "entity.name.class"], settings: { foreground: "#9fdcff" } },
    { scope: ["keyword.operator", "punctuation"], settings: { foreground: "#d8d0ef" } },
  ],
} as const;

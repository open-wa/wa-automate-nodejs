import { EditorRED } from "node-red";
import { OwaServerEditorNodeProperties } from "./modules/types";

declare const RED: EditorRED;

RED.nodes.registerType<OwaServerEditorNodeProperties>("owa-server", {
  category: "config",
  defaults: {
    name: { value: "" },
    url: { value: "" },
    key: { value: "" }
  },
  label: function () {
    return this.name || "owa server";
  },
});

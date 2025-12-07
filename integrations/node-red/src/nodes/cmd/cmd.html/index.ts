/* eslint-disable @typescript-eslint/ban-ts-comment */
import { EditorRED } from "node-red";
import { CmdEditorNodeProperties } from "./modules/types";

declare const RED: EditorRED;

RED.nodes.registerType<CmdEditorNodeProperties>("cmd", {
  category: "wa",
  color: "#DEBD5C",
  defaults: {
    name: { value: "" },
    server: { value: "", type: "owa-server" },
    method: { value: "" },
    args: { value: "" },
    timeout: { value: "-1", validate:RED.validators.number(true) }
  },
  inputs: 1,
  outputs: 1,
  icon: "feed.svg",
  paletteLabel: "Command",
  label: function () {
    return this.name || this.method || "cmd";
  },
  oneditprepare: function () {
    const args = $("#node-input-args").typedInput({
      default: "json",
      types: ["json"]
    })
    $.getJSON('node_red_init_call',(data) => {
      //... does stuff with data
      if(typeof data == "string") return $("#node-input-method").append(
        new Option(data, data, undefined, true)
      )
      $("#node-input-method")
    .find('option')
    .remove()

    Object.keys(data).map((method) =>
    $("#node-input-method").append(
      new Option(method, method, undefined, method === this.method)
    )
  );

  //@ts-ignore
  $("#node-input-method").on('change', event=>$('#node-input-args').typedInput('value',JSON.stringify(data[event.target.value])))

  });
  

    
    
  }
});

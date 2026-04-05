import { ServerSubscriber } from './../../../shared/common';
import { EditorNodeProperties } from "node-red";
import { CmdOptions } from "../../shared/types";

export interface CmdEditorNodeProperties
  extends EditorNodeProperties,
    CmdOptions, ServerSubscriber {}

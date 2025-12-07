import { EditorNodeProperties } from "node-red";
import { ServerSubscriber } from "../../../shared/types";
import { ListenOptions } from "../../shared/types";

export interface ListenEditorNodeProperties
  extends EditorNodeProperties,
    ListenOptions, ServerSubscriber {
      listener: string
    } 
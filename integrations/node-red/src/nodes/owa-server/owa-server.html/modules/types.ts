import { EasyAPIServer } from './../../../shared/common';
import { EditorNodeProperties } from "node-red";
import { OwaServerOptions } from "../../shared/types";

export interface OwaServerEditorNodeProperties
  extends EditorNodeProperties,
    OwaServerOptions, EasyAPIServer {}

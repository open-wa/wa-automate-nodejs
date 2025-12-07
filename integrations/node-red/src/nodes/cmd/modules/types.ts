import { SimpleListener } from "@open-wa/wa-automate-types-only";
import { Node, NodeDef } from "node-red";
import { OwaServerNode } from "src/nodes/owa-server/modules/types";
import { ServerSubscriber } from "src/nodes/shared/types";
import { CmdOptions } from "../shared/types";

export interface CmdNodeDef extends NodeDef, CmdOptions, ServerSubscriber  {}

// export interface CmdNode extends Node {}
export type CmdNode = Node & {
    server?: OwaServerNode,
    method ?: string,
    timeout ?: number,
    args ?: {
        [k: string]: boolean | string | number | undefined
    }
}

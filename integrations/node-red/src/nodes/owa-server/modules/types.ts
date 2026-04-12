import { SocketClient } from '@open-wa/socket-client';
import { EasyAPIServer } from './../../shared/types';
import { Node, NodeDef } from "node-red";
import { OwaServerOptions } from "../shared/types";

// Legacy compatibility surface: these names are retained for Node-RED, but the
// underlying client is the v5 remote transport wrapper rather than @open-wa/api
// SocketManager.

export interface OwaServerNodeDef extends NodeDef, OwaServerOptions, EasyAPIServer {}

// export interface OwaServerNode extends Node {}
export type OwaServerNode = Node & EasyAPIServer & {
    client : SocketClient,
    clientSocket : SocketClient["socket"],
    getSocket : () => Promise<SocketClient | undefined>
};

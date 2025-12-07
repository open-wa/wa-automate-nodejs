import { SimpleListener } from '@open-wa/wa-automate-types-only';
import { OwaServerNode } from './../../owa-server/modules/types';
import { ServerSubscriber } from '../../shared/types';
import { Node, NodeDef } from "node-red";
import { ListenOptions } from "../shared/types";
import EventEmitter from 'events';

export interface ListenNodeDef extends NodeDef, ListenOptions, ServerSubscriber {
    listener : SimpleListener
}

// export interface ListenNode extends Node {}
export type ListenNode = Node & {
    server?: OwaServerNode,
    listener : SimpleListener,
    socketClientListener ?: EventEmitter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listenerFn : (data: any) => void,
    callbackId: string
};

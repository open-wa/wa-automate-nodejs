import { Id } from './id';

export interface GroupMetadata {
  id: Id;
  creation: number;
  owner: {
    server: string;
    user: string;
    _serialized: string;
  };
  participants: any[];
  pendingParticipants: any[];
}

export enum groupChangeEvent {
  remove = 'remove',
  add = 'add'
}


export interface ParticipantChangedEventModel {
  by: Id,
  action: groupChangeEvent,
  who: [Id]
}
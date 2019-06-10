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

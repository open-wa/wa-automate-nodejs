import { PollVoteSchema } from '../polls';
import { defineListenerV2 } from './registry';

export const pollVoteEvent = defineListenerV2('pollVote', {
  legacyName: 'onPollVote',
  meta: {
    namespace: 'messages', license: 'none', status: 'beta',
    description: 'A decrypted poll vote added or changed in the synced store. Hydration can emit old votes. Hidden-voter polls omit sender and message identifiers. Deduplicate ordinary votes by id and timestamp; refresh getPollResults for current totals.',
  },
  payload: PollVoteSchema, defaultQueueOptions: { concurrency: 1 },
});

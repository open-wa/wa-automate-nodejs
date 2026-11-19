import { PollVoteSchema } from '../polls';
import { defineListenerV2 } from './registry';

export const pollVoteEvent = defineListenerV2('pollVote', {
  legacyName: 'onPollVote',
  meta: {
    namespace: 'messages', license: 'none', status: 'beta',
    description: 'Someone voted on a poll or changed their vote. Older votes can arrive again after the session starts, so deduplicate by id and timestamp and call getPollResults for current totals. Polls with hidden voters leave out sender and message IDs.',
  },
  payload: PollVoteSchema, defaultQueueOptions: { concurrency: 1 },
});

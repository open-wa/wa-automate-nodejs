import type { InteractiveContent } from '@open-wa/schema';
import type { ActionPreview, BookingInput } from './actions';
import type { ActionDecision, DecisionContext } from './jev';
import type { ChatTurn } from './provider';
export type Turn = { id: string; role: 'user' | 'assistant'; text: string; at: number; state: string; channel: Conversation['channel']; action?: 'send_chat_message' | 'correct_booking_card'; classification?: ActionDecision; requestedFormats?: ActionDecision['requestedFormats']; decisionTrail?: Array<{ at: number; phase: DecisionContext['phase']; decision: ActionDecision }>; preview?: ActionPreview; interactive?: InteractiveContent; openui?: string; bookingInput?: BookingInput; replacesMessageId?: string; replacedByMessageId?: string; previousCardRemoval?: 'removed' | 'failed' | 'unknown'; selection?: boolean; messageId?: string; error?: string; interrupted?: boolean; audioId?: string; textId?: string; audioState?: string; textState?: string };
export type Conversation = { id: string; peer: string; name: string; channel: 'text' | 'voice-notes' | 'calls'; state: string; updatedAt: number; turns: Turn[]; history: ChatTurn[] };

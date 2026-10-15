// Free vs licensed, framed by job. Method names and tiers from the fact pack's
// licences and jobs; prices from tiers.
import { insiders, restricted } from "./facts";

export const byJob = [
  { job: "Reply to people who message you", methods: ["onMessage", "sendText"], tier: "none", label: "No key" },
  { job: "Booking polls and event cards", methods: ["sendPoll", "sendEvent", "onEventResponse"], tier: "none", label: "No key" },
  { job: "Photos, PDFs, voice notes, video", methods: ["sendImage", "sendFile", "sendPtt"], tier: "none", label: "No key" },
  { job: "Webhooks, Chatwoot, MCP for free methods", methods: ["plugins"], tier: "none", label: "No key" },
  { job: "Buttons, lists and interactive messages", methods: ["sendButtons", "sendListMessage", "sendInteractive"], tier: "insiders", label: `Insiders, ${insiders.prices.month}/mo` },
  { job: "Check a number is on WhatsApp", methods: ["checkNumberStatus", "getNumberProfile"], tier: "insiders", label: `Insiders, ${insiders.prices.month}/mo` },
  { job: "OTP codes and first messages to new numbers", methods: ["sendText to a new number"], tier: "restricted", label: `Restricted, ${restricted.prices.month}/mo` },
  { job: "Create and join groups", methods: ["createGroup", "joinGroupViaLink", "joinGroup"], tier: "restricted", label: `Restricted, ${restricted.prices.month}/mo` },
  { job: "Answer and start calls", methods: ["onIncomingCall", "startCall"], tier: "calling", label: "Calling-enabled key, preview" },
];

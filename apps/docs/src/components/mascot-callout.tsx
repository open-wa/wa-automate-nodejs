import { useLocation } from '@tanstack/react-router';
import { cn } from '@/lib/cn';

type MascotEntry = {
  src: string;
  title: string;
  activity: string;
};

export const MASCOT_BY_PATH: Record<string, MascotEntry> = {
  '/docs': {
    src: '/mascots/wally-docs-map.png',
    title: 'Map Wally',
    activity: 'mapping the safest route from quick start to production operations.',
  },
  '/docs/getting-started/quickstart': {
    src: '/mascots/wally-quickstart-rocket.png',
    title: 'Quickstart Wally',
    activity: 'launching a tiny first-success rocket beside the session console.',
  },
  '/docs/getting-started/link-code': {
    src: '/mascots/wally-link-code-phone.png',
    title: 'Link-code Wally',
    activity: 'pairing a phone and secure login charm without exposing real codes.',
  },
  '/docs/getting-started/easy-api': {
    src: '/mascots/wally-easy-api-counter.png',
    title: 'Easy API Wally',
    activity: 'serving API envelopes from a friendly retro service counter.',
  },
  '/docs/getting-started/custom-code': {
    src: '/mascots/wally-custom-code-workbench.png',
    title: 'Custom-code Wally',
    activity: 'snapping runtime modules together at a tidy code workbench.',
  },
  '/docs/getting-started/docker': {
    src: '/mascots/wally-docker-container.png',
    title: 'Container Wally',
    activity: 'packing a browser window and session token into a safe container.',
  },
  '/docs/getting-started/v5-alpha': {
    src: '/mascots/wally-alpha-lab.png',
    title: 'Alpha-lab Wally',
    activity: 'testing the glowing alpha crystal with careful lab goggles.',
  },
  '/docs/concepts/how-it-works': {
    src: '/mascots/wally-runtime-diagram.png',
    title: 'Runtime Wally',
    activity: 'pointing out the runtime path through connected pixel blocks.',
  },
  '/docs/concepts/data-models': {
    src: '/mascots/wally-data-models.png',
    title: 'Data-model Wally',
    activity: 'sorting messages, contacts, and events into tidy trays.',
  },
  '/docs/concepts/packages': {
    src: '/mascots/wally-package-shelves.png',
    title: 'Package Wally',
    activity: 'organizing the monorepo package shelves by purpose.',
  },
  '/docs/concepts/glossary': {
    src: '/mascots/wally-glossary-book.png',
    title: 'Glossary Wally',
    activity: 'looking up terms in a chunky pixel glossary book.',
  },
  '/docs/guides/integrations-overview': {
    src: '/mascots/wally-integration-hub.png',
    title: 'Integration Wally',
    activity: 'keeping app tiles, webhooks, clouds, and inboxes connected.',
  },
  '/docs/guides/chatid-primer': {
    src: '/mascots/wally-chatid-name-tags.png',
    title: 'Chat ID Wally',
    activity: 'pinning tidy name tags onto each kind of chat bubble.',
  },
  '/docs/guides/authentication-flow': {
    src: '/mascots/wally-auth-checkpoint.png',
    title: 'Auth Wally',
    activity: 'guiding a phone through a friendly security checkpoint.',
  },
  '/docs/guides/messages': {
    src: '/mascots/wally-message-bubbles.png',
    title: 'Message Wally',
    activity: 'carrying message bubbles along a safe delivery path.',
  },
  '/docs/guides/media': {
    src: '/mascots/wally-media-camera.png',
    title: 'Media Wally',
    activity: 'organizing photos, voice notes, and file cards on a media desk.',
  },
  '/docs/guides/groups': {
    src: '/mascots/wally-group-circle.png',
    title: 'Group Wally',
    activity: 'hosting a friendly circle of group chat avatars.',
  },
  '/docs/guides/group-filtering': {
    src: '/mascots/wally-filter-sieve.png',
    title: 'Filter Wally',
    activity: 'separating group and direct-message bubbles into tidy baskets.',
  },
  '/docs/guides/message-deletion': {
    src: '/mascots/wally-message-eraser.png',
    title: 'Deletion Wally',
    activity: 'gently erasing one message bubble while preserving the rest.',
  },
  '/docs/guides/session-events': {
    src: '/mascots/wally-event-bell.png',
    title: 'Event Wally',
    activity: 'listening for lifecycle bells and session event cards.',
  },
  '/docs/guides/multiple-sessions': {
    src: '/mascots/wally-session-switchboard.png',
    title: 'Session Wally',
    activity: 'operating a vintage switchboard of named session lights.',
  },
  '/docs/guides/webhooks-for-business': {
    src: '/mascots/wally-webhook-fishing.png',
    title: 'Webhook Wally',
    activity: 'catching event bubbles with a hook-shaped connector.',
  },
  '/docs/guides/node-red': {
    src: '/mascots/wally-node-flow.png',
    title: 'Node-flow Wally',
    activity: 'arranging red-toned flow nodes with noodle-like wires.',
  },
  '/docs/guides/s3-media': {
    src: '/mascots/wally-cloud-storage.png',
    title: 'Cloud-storage Wally',
    activity: 'uploading media cards into a locked cloud vault.',
  },
  '/docs/guides/mcp': {
    src: '/mascots/wally-mcp-tools.png',
    title: 'MCP Wally',
    activity: 'offering safe tool cards to a friendly robot arm.',
  },
  '/docs/guides/ai-agent-patterns': {
    src: '/mascots/wally-agent-orchestrator.png',
    title: 'Agent Wally',
    activity: 'conducting helper bots inside a safe orchestration circle.',
  },
  '/docs/guides/configuration-and-cli': {
    src: '/mascots/wally-cli-control-panel.png',
    title: 'CLI Wally',
    activity: 'tuning retro toggles, env blocks, and terminal cards.',
  },
  '/docs/guides/config-schema': {
    src: '/mascots/wally-schema-blueprint.png',
    title: 'Schema Wally',
    activity: 'reviewing nested config boxes on a blue pixel blueprint.',
  },
  '/docs/guides/config-secrets': {
    src: '/mascots/wally-secrets-vault.png',
    title: 'Secrets Wally',
    activity: 'locking golden key icons and env cards safely in a vault.',
  },
  '/docs/guides/rate-limits': {
    src: '/mascots/wally-rate-limit-traffic.png',
    title: 'Rate-limit Wally',
    activity: 'spacing message bubbles through a safety-first traffic lane.',
  },
  '/docs/guides/logging-and-audit': {
    src: '/mascots/wally-audit-ledger.png',
    title: 'Audit Ledger Wally',
    activity: 'illustrating the logging and audit trails guide with tidy pixel props.',
  },
  '/docs/client-and-integrations/socket-client': {
    src: '/mascots/wally-socket-cable.png',
    title: 'Socket Cable Wally',
    activity: 'connecting the socket client flow with safe retro cables.',
  },
  '/docs/client-and-integrations/webhook-payloads': {
    src: '/mascots/wally-payload-envelope.png',
    title: 'Payload Envelope Wally',
    activity: 'connecting the webhook payloads flow with safe retro cables.',
  },
  '/docs/client-and-integrations/proxying-a-session': {
    src: '/mascots/wally-session-tunnel.png',
    title: 'Session Tunnel Wally',
    activity: 'connecting the proxying a session flow with safe retro cables.',
  },
  '/docs/client-and-integrations/cf-proxy': {
    src: '/mascots/wally-cloudflare-tunnel.png',
    title: 'Cloudflare Tunnel Wally',
    activity: 'connecting the cloudflare session proxy flow with safe retro cables.',
  },
  '/docs/client-and-integrations/chatwoot': {
    src: '/mascots/wally-support-inbox.png',
    title: 'Support Inbox Wally',
    activity: 'connecting the chatwoot integration flow with safe retro cables.',
  },
  '/docs/plugins/getting-started': {
    src: '/mascots/wally-plugin-starter-kit.png',
    title: 'Plugin Starter Kit Wally',
    activity: 'arranging plugin pieces for plugin getting started without crossing host boundaries.',
  },
  '/docs/plugins/security-model': {
    src: '/mascots/wally-plugin-sandbox.png',
    title: 'Plugin Sandbox Wally',
    activity: 'arranging plugin pieces for plugin security model without crossing host boundaries.',
  },
  '/docs/plugins/reference-plugin-walkthrough': {
    src: '/mascots/wally-plugin-cutaway.png',
    title: 'Plugin Cutaway Wally',
    activity: 'arranging plugin pieces for anatomy of a plugin without crossing host boundaries.',
  },
  '/docs/plugins/example-dictation': {
    src: '/mascots/wally-plugin-dictation-mic.png',
    title: 'Plugin Dictation Mic Wally',
    activity: 'arranging plugin pieces for example: voice note transcription without crossing host boundaries.',
  },
  '/docs/plugins/example-moderation': {
    src: '/mascots/wally-plugin-moderation-shield.png',
    title: 'Plugin Moderation Shield Wally',
    activity: 'arranging plugin pieces for example: openai moderation without crossing host boundaries.',
  },
  '/docs/plugins/plugin-input': {
    src: '/mascots/wally-plugin-input-kit.png',
    title: 'Plugin Input Kit Wally',
    activity: 'arranging plugin pieces for plugininput breakdown without crossing host boundaries.',
  },
  '/docs/plugins/hooks-reference': {
    src: '/mascots/wally-plugin-hook-rack.png',
    title: 'Plugin Hook Rack Wally',
    activity: 'arranging plugin pieces for hooks reference without crossing host boundaries.',
  },
  '/docs/plugins/plugin-client': {
    src: '/mascots/wally-plugin-client-proxy.png',
    title: 'Plugin Client Proxy Wally',
    activity: 'arranging plugin pieces for pluginclient reference without crossing host boundaries.',
  },
  '/docs/plugins/dashboard-pages': {
    src: '/mascots/wally-plugin-dashboard-board.png',
    title: 'Plugin Dashboard Board Wally',
    activity: 'arranging plugin pieces for dashboard pages without crossing host boundaries.',
  },
  '/docs/plugins/hono-routes': {
    src: '/mascots/wally-plugin-route-signpost.png',
    title: 'Plugin Route Signpost Wally',
    activity: 'arranging plugin pieces for http routes in plugins without crossing host boundaries.',
  },
  '/docs/plugins/ai-tools': {
    src: '/mascots/wally-plugin-ai-tools-tray.png',
    title: 'Plugin Ai Tools Wally',
    activity: 'arranging plugin pieces for ai tools without crossing host boundaries.',
  },
  '/docs/plugins/external-api-patterns': {
    src: '/mascots/wally-plugin-api-bridge.png',
    title: 'Plugin Api Bridge Wally',
    activity: 'arranging plugin pieces for external api patterns without crossing host boundaries.',
  },
  '/docs/plugins/publishing': {
    src: '/mascots/wally-plugin-package-press.png',
    title: 'Plugin Package Press Wally',
    activity: 'arranging plugin pieces for publishing a plugin without crossing host boundaries.',
  },
  '/docs/reference': {
    src: '/mascots/wally-api-reference-library.png',
    title: 'Api Reference Library Wally',
    activity: 'cataloging api reference cards in the reference library.',
  },
  '/docs/reference/workspaces': {
    src: '/mascots/wally-workspace-map.png',
    title: 'Workspace Map Wally',
    activity: 'cataloging workspace reference cards in the reference library.',
  },
  '/docs/reference/workspaces/apps': {
    src: '/mascots/wally-workspace-app-shelf.png',
    title: 'Workspace App Shelf Wally',
    activity: 'checking the Apps app console on the workspace shelf.',
  },
  '/docs/reference/workspaces/apps/cli': {
    src: '/mascots/wally-app-cli-console.png',
    title: 'App Cli Console Wally',
    activity: 'checking the @open-wa/cli-app app console on the workspace shelf.',
  },
  '/docs/reference/workspaces/apps/dashboard-neo': {
    src: '/mascots/wally-app-dashboard-neo-console.png',
    title: 'App Dashboard Neo Wally',
    activity: 'checking the @open-wa/dashboard-neo app console on the workspace shelf.',
  },
  '/docs/reference/workspaces/apps/docker': {
    src: '/mascots/wally-app-docker-console.png',
    title: 'App Docker Console Wally',
    activity: 'checking the @open-wa/docker app console on the workspace shelf.',
  },
  '/docs/reference/workspaces/apps/docs': {
    src: '/mascots/wally-app-docs-console.png',
    title: 'App Docs Console Wally',
    activity: 'checking the docs app console on the workspace shelf.',
  },
  '/docs/reference/workspaces/apps/orchestrator-cli': {
    src: '/mascots/wally-app-orchestrator-cli-console.png',
    title: 'App Orchestrator Cli Wally',
    activity: 'checking the @open-wa/orchestrator-cli app console on the workspace shelf.',
  },
  '/docs/reference/workspaces/apps/orchestrator-dashboard': {
    src: '/mascots/wally-app-orchestrator-dashboard-console.png',
    title: 'App Orchestrator Dashboard Wally',
    activity: 'checking the @open-wa/orchestrator-dashboard app console on the workspace shelf.',
  },
  '/docs/reference/workspaces/apps/registry': {
    src: '/mascots/wally-app-registry-console.png',
    title: 'App Registry Console Wally',
    activity: 'checking the registry app console on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages': {
    src: '/mascots/wally-workspace-package-shelf.png',
    title: 'Workspace Package Shelf Wally',
    activity: 'placing the Packages package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/api': {
    src: '/mascots/wally-package-api-box.png',
    title: 'Package Api Box Wally',
    activity: 'placing the @open-wa/api package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/cf-proxy': {
    src: '/mascots/wally-package-cf-proxy-box.png',
    title: 'Package Cf Proxy Wally',
    activity: 'placing the @open-wa/cf-proxy package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/cli': {
    src: '/mascots/wally-package-cli-box.png',
    title: 'Package Cli Box Wally',
    activity: 'placing the @open-wa/cli package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/client': {
    src: '/mascots/wally-package-client-box.png',
    title: 'Package Client Box Wally',
    activity: 'placing the @open-wa/client package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/config': {
    src: '/mascots/wally-package-config-box.png',
    title: 'Package Config Box Wally',
    activity: 'placing the @open-wa/config package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/core': {
    src: '/mascots/wally-package-core-box.png',
    title: 'Package Core Box Wally',
    activity: 'placing the @open-wa/core package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/decrypt': {
    src: '/mascots/wally-package-decrypt-box.png',
    title: 'Package Decrypt Box Wally',
    activity: 'placing the @open-wa/decrypt package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/domain': {
    src: '/mascots/wally-package-domain-box.png',
    title: 'Package Domain Box Wally',
    activity: 'placing the @open-wa/domain package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/driver-interface': {
    src: '/mascots/wally-package-driver-interface-box.png',
    title: 'Package Driver Interface Wally',
    activity: 'placing the @open-wa/driver-interface package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/driver-lightpanda': {
    src: '/mascots/wally-package-driver-lightpanda-box.png',
    title: 'Package Driver Lightpanda Wally',
    activity: 'placing the @open-wa/driver-lightpanda package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/driver-playwright': {
    src: '/mascots/wally-package-driver-playwright-box.png',
    title: 'Package Driver Playwright Wally',
    activity: 'placing the @open-wa/driver-playwright package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/driver-puppeteer': {
    src: '/mascots/wally-package-driver-puppeteer-box.png',
    title: 'Package Driver Puppeteer Wally',
    activity: 'placing the @open-wa/driver-puppeteer package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/hyperemitter': {
    src: '/mascots/wally-package-hyperemitter-box.png',
    title: 'Package Hyperemitter Box Wally',
    activity: 'placing the @open-wa/hyperemitter package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/legacy': {
    src: '/mascots/wally-package-legacy-box.png',
    title: 'Package Legacy Box Wally',
    activity: 'placing the @open-wa/legacy package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/legacy-documented': {
    src: '/mascots/wally-package-legacy-documented-box.png',
    title: 'Package Legacy Documented Wally',
    activity: 'placing the @open-wa/legacy-documented package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/logger': {
    src: '/mascots/wally-package-logger-box.png',
    title: 'Package Logger Box Wally',
    activity: 'placing the @open-wa/logger package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/mcp': {
    src: '/mascots/wally-package-mcp-box.png',
    title: 'Package Mcp Box Wally',
    activity: 'placing the @open-wa/mcp package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/orchestrator': {
    src: '/mascots/wally-package-orchestrator-box.png',
    title: 'Package Orchestrator Box Wally',
    activity: 'placing the @open-wa/orchestrator package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/plugin-sdk': {
    src: '/mascots/wally-package-plugin-sdk-box.png',
    title: 'Package Plugin Sdk Wally',
    activity: 'placing the @open-wa/plugin-sdk package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/schema': {
    src: '/mascots/wally-package-schema-box.png',
    title: 'Package Schema Box Wally',
    activity: 'placing the @open-wa/schema package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/screencaster': {
    src: '/mascots/wally-package-screencaster-box.png',
    title: 'Package Screencaster Box Wally',
    activity: 'placing the @open-wa/screencaster package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/session-sync': {
    src: '/mascots/wally-package-session-sync-box.png',
    title: 'Package Session Sync Wally',
    activity: 'placing the @open-wa/session-sync package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/socket-client': {
    src: '/mascots/wally-package-socket-client-box.png',
    title: 'Package Socket Client Wally',
    activity: 'placing the @open-wa/socket-client package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/types-only': {
    src: '/mascots/wally-package-types-only-box.png',
    title: 'Package Types Only Wally',
    activity: 'placing the @open-wa/wa-automate-types-only package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/ui-components': {
    src: '/mascots/wally-package-ui-components-box.png',
    title: 'Package Ui Components Wally',
    activity: 'placing the @open-wa/ui-components package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/utils': {
    src: '/mascots/wally-package-utils-box.png',
    title: 'Package Utils Box Wally',
    activity: 'placing the @open-wa/utils package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/packages/wa-automate': {
    src: '/mascots/wally-package-wa-automate-box.png',
    title: 'Package Wa Automate Wally',
    activity: 'placing the @open-wa/wa-automate package box on the workspace shelf.',
  },
  '/docs/reference/workspaces/integrations': {
    src: '/mascots/wally-workspace-integration-shelf.png',
    title: 'Workspace Integration Shelf Wally',
    activity: 'plugging the Integrations integration into the workspace hub.',
  },
  '/docs/reference/workspaces/integrations/chatwoot': {
    src: '/mascots/wally-integration-chatwoot-connector.png',
    title: 'Integration Chatwoot Connector Wally',
    activity: 'plugging the @open-wa/integration-chatwoot integration into the workspace hub.',
  },
  '/docs/reference/workspaces/integrations/cloudflare': {
    src: '/mascots/wally-integration-cloudflare-connector.png',
    title: 'Integration Cloudflare Connector Wally',
    activity: 'plugging the @open-wa/integration-cloudflare integration into the workspace hub.',
  },
  '/docs/reference/workspaces/integrations/node-red': {
    src: '/mascots/wally-integration-node-red-connector.png',
    title: 'Integration Node Red Wally',
    activity: 'plugging the @open-wa/node-red integration into the workspace hub.',
  },
  '/docs/reference/workspaces/integrations/s3': {
    src: '/mascots/wally-integration-s3-connector.png',
    title: 'Integration S3 Connector Wally',
    activity: 'plugging the @open-wa/integration-s3 integration into the workspace hub.',
  },
  '/docs/reference/workspaces/integrations/webhook': {
    src: '/mascots/wally-integration-webhook-connector.png',
    title: 'Integration Webhook Connector Wally',
    activity: 'plugging the @open-wa/integration-webhook integration into the workspace hub.',
  },
  '/docs/reference/client': {
    src: '/mascots/wally-client-reference-index.png',
    title: 'Client Reference Index Wally',
    activity: 'indexing client api reference method cards in the client reference catalog.',
  },
  '/docs/reference/client/client': {
    src: '/mascots/wally-client-client-methods.png',
    title: 'Client Client Methods Wally',
    activity: 'indexing client methods method cards in the client reference catalog.',
  },
  '/docs/reference/client/business': {
    src: '/mascots/wally-client-business-methods.png',
    title: 'Client Business Methods Wally',
    activity: 'indexing business method cards in the client reference catalog.',
  },
  '/docs/reference/client/chatids': {
    src: '/mascots/wally-client-chatids-methods.png',
    title: 'Client Chatids Methods Wally',
    activity: 'indexing chatids method cards in the client reference catalog.',
  },
  '/docs/reference/client/chats': {
    src: '/mascots/wally-client-chats-methods.png',
    title: 'Client Chats Methods Wally',
    activity: 'indexing chats method cards in the client reference catalog.',
  },
  '/docs/reference/client/communities': {
    src: '/mascots/wally-client-communities-methods.png',
    title: 'Client Communities Methods Wally',
    activity: 'indexing communities method cards in the client reference catalog.',
  },
  '/docs/reference/client/contacts': {
    src: '/mascots/wally-client-contacts-methods.png',
    title: 'Client Contacts Methods Wally',
    activity: 'indexing contacts method cards in the client reference catalog.',
  },
  '/docs/reference/client/groups': {
    src: '/mascots/wally-client-groups-methods.png',
    title: 'Client Groups Methods Wally',
    activity: 'indexing groups method cards in the client reference catalog.',
  },
  '/docs/reference/client/labels': {
    src: '/mascots/wally-client-labels-methods.png',
    title: 'Client Labels Methods Wally',
    activity: 'indexing labels method cards in the client reference catalog.',
  },
  '/docs/reference/client/media': {
    src: '/mascots/wally-client-media-methods.png',
    title: 'Client Media Methods Wally',
    activity: 'indexing media method cards in the client reference catalog.',
  },
  '/docs/reference/client/messages': {
    src: '/mascots/wally-client-messages-methods.png',
    title: 'Client Messages Methods Wally',
    activity: 'indexing messages method cards in the client reference catalog.',
  },
  '/docs/reference/client/mystatus': {
    src: '/mascots/wally-client-mystatus-methods.png',
    title: 'Client Mystatus Methods Wally',
    activity: 'indexing mystatus method cards in the client reference catalog.',
  },
  '/docs/reference/client/session': {
    src: '/mascots/wally-client-session-methods.png',
    title: 'Client Session Methods Wally',
    activity: 'indexing session method cards in the client reference catalog.',
  },
  '/docs/reference/client/status': {
    src: '/mascots/wally-client-status-methods.png',
    title: 'Client Status Methods Wally',
    activity: 'indexing status method cards in the client reference catalog.',
  },
  '/docs/reference/messaging': {
    src: '/mascots/wally-message-reference-cards.png',
    title: 'Message Reference Cards Wally',
    activity: 'cataloging messaging reference cards in the reference library.',
  },
  '/docs/reference/events': {
    src: '/mascots/wally-event-catalog.png',
    title: 'Event Catalog Wally',
    activity: 'cataloging event reference cards in the reference library.',
  },
  '/docs/reference/core': {
    src: '/mascots/wally-core-control-room.png',
    title: 'Core Control Room Wally',
    activity: 'cataloging core client reference cards in the reference library.',
  },
  '/docs/operations/security-and-deployment': {
    src: '/mascots/wally-security-shield.png',
    title: 'Security Shield Wally',
    activity: 'checking the security and deployment runbook before production traffic starts.',
  },
  '/docs/operations-and-troubleshooting/best-practices': {
    src: '/mascots/wally-production-checklist.png',
    title: 'Production Checklist Wally',
    activity: 'checking the best practices runbook before production traffic starts.',
  },
  '/docs/operations-and-troubleshooting/error-handling': {
    src: '/mascots/wally-error-toolbox.png',
    title: 'Error Toolbox Wally',
    activity: 'checking the error handling runbook before production traffic starts.',
  },
  '/docs/operations-and-troubleshooting/detect-logouts': {
    src: '/mascots/wally-logout-beacon.png',
    title: 'Logout Beacon Wally',
    activity: 'checking the detect logouts runbook before production traffic starts.',
  },
  '/docs/licensing/licensed-features': {
    src: '/mascots/wally-license-feature-gate.png',
    title: 'License Feature Gate Wally',
    activity: 'sorting license keys and feature gates for licensed features.',
  },
  '/docs/licensing/pricing': {
    src: '/mascots/wally-license-ticket.png',
    title: 'License Ticket Wally',
    activity: 'sorting license keys and feature gates for pricing and licensing.',
  },
};

function normalizeMascotPath(path: string): string {
  const normalized = path.replace(/\/$/, '') || '/docs';

  if (normalized === '/docs/index') return '/docs';
  return normalized.endsWith('/index') ? normalized.slice(0, -6) : normalized;
}

export function getMascotForPath(path: string): MascotEntry | undefined {
  return MASCOT_BY_PATH[normalizeMascotPath(path)];
}

export function MascotCallout({
  className,
  onlyMapped = false,
}: {
  className?: string;
  onlyMapped?: boolean;
}) {
  const location = useLocation();
  const entry = getMascotForPath(location.pathname);

  if (!entry && onlyMapped) return null;

  const mascot = entry ?? MASCOT_BY_PATH['/docs'];

  return (
    <div className={cn("flex items-center gap-4 px-4 py-3 border-backstitch rounded-2xl bg-card shadow-stipple relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-dither opacity-[0.15] pointer-events-none" />
      
      <div className="relative w-12 h-12 shrink-0 rounded-xl overflow-hidden border-2 border-foreground bg-background p-0.5 shadow-sm z-10">
        <img 
          src={mascot.src} 
          alt={mascot.title} 
          className="w-full h-full object-cover rounded-lg"
        />
      </div>
      <div className="z-10 min-w-0">
        <h4 className="font-display font-bold text-sm text-foreground flex items-center gap-1.5">
          <span className="text-sm">🧵</span> {mascot.title} says...
        </h4>
        <p className="text-muted-foreground text-xs mt-0.5 italic font-medium truncate">
          &quot;I am currently {mascot.activity}&quot;
        </p>
      </div>
    </div>
  );
}

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
};

export function getMascotForPath(path: string): MascotEntry | undefined {
  return MASCOT_BY_PATH[path.replace(/\/$/, '') || '/docs'];
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

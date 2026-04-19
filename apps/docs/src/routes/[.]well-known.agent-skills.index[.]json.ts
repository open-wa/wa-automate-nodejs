import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/.well-known/agent-skills/index.json')({
  // @ts-expect-error TanStack types mismatch
  server: {
    handlers: {
      GET() {
        // Return an agent skills index matching Agent Skills Discovery RFC v0.2.0
        const skillsIndex = {
          "$schema": "https://agentskills.io/schema/v0.2.0/index.json",
          "skills": [
            {
              "name": "read-documentation",
              "type": "api",
              "description": "Reads OpenWA developer documentation in Markdown format.",
              "url": "https://openwa.dev/llms.mdx/docs/",
              "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" // dummy hash for example
            }
          ]
        };
        
        return new Response(JSON.stringify(skillsIndex, null, 2), {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      },
    },
  },
});

import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@open-wa/ui-components/src/components/ui/button';

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="p-4">
      <h3 className="text-xl font-bold">OpenWA Orchestrator</h3>
      <div className="mt-4">
        <Button asChild>
            <a href="/sessions">Manage Sessions</a>
        </Button>
      </div>
    </div>
  )
}

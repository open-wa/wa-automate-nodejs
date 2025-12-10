import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@open-wa/ui-components/src/components/ui/button';

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="p-2">
      <h3 className="text-xl font-bold">Welcome to OpenWA Dashboard!</h3>
      <div className="mt-4 flex gap-2">
        <Button asChild>
            <a href="/qr">Scan QR</a>
        </Button>
        <Button variant="outline" asChild>
            <a href="/chats">View Chats</a>
        </Button>
      </div>
    </div>
  )
}

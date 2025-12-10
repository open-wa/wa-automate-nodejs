import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api-client';
import { cn } from '../lib/utils';

export const Route = createFileRoute('/events')({
  component: EventsPage,
})

interface EventLog {
  id: number;
  timestamp: string;
  name: string;
  args: any[];
}

function EventsPage() {
  const [events, setEvents] = useState<EventLog[]>([]);

  useEffect(() => {
    apiClient.onAny((name, ...args) => {
      setEvents(prev => [{
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        name,
        args
      }, ...prev].slice(0, 100)); // Keep last 100 events
    });
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Live Events</h1>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b">
            <tr>
              <th className="p-2 text-left w-32">Time</th>
              <th className="p-2 text-left w-48">Event</th>
              <th className="p-2 text-left">Payload</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
               <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">
                  Waiting for events...
                </td>
              </tr>
            ) : (
              events.map((event, i) => (
                <tr key={event.id} className={cn("border-b last:border-0", i % 2 === 0 ? "bg-white" : "bg-slate-50")}>
                  <td className="p-2 font-mono text-gray-500">{event.timestamp}</td>
                  <td className="p-2 font-medium text-blue-600">{event.name}</td>
                  <td className="p-2 font-mono text-xs overflow-x-auto">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(event.args, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

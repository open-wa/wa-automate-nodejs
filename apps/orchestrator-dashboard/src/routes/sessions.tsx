import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/sessions')({
  component: SessionsPage,
})

function SessionsPage() {
  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => fetch('http://localhost:9000/sessions').then(r => r.json()),
  });

  return (
    <div>
      <h1>Sessions</h1>
      {sessions?.map((s: any) => (
        <div key={s.id}>
          {s.id} - {s.status}
        </div>
      ))}
    </div>
  );
}

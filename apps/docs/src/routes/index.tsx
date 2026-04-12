import { createFileRoute } from '@tanstack/react-router';
import { DocsHomepage } from '@/components/homepage';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return <DocsHomepage />;
}

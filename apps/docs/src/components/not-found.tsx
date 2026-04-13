import { Link } from '@tanstack/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';

export function NotFound() {
  return (
    <HomeLayout {...baseOptions()} className="justify-center py-32 text-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-6xl font-bold text-fd-muted-foreground">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-fd-muted-foreground max-w-md">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <Link
          to="/"
          className="mt-4 rounded-full bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
        >
          Back to Home
        </Link>
      </div>
    </HomeLayout>
  );
}

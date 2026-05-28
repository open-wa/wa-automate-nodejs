import { Link } from '@tanstack/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { cn } from '@/lib/cn';

export function NotFound() {
  return (
    <HomeLayout
      {...baseOptions()}
      className="relative justify-center overflow-hidden bg-background py-32 text-center"
    >
      <div className="relative mx-auto flex max-w-xl flex-col items-center gap-4 rounded-3xl border-backstitch bg-card p-8 shadow-stipple">
        <div className="pointer-events-none absolute inset-0 bg-dither opacity-[0.12]" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <h1 className="font-display text-6xl font-bold text-primary">404</h1>
          <h2 className="font-display text-balance text-2xl font-bold text-foreground">
            Page Not Found
          </h2>
          <p className="max-w-md text-pretty text-muted-foreground">
            The page you are looking for might have been removed, had its name
            changed, or is temporarily unavailable.
          </p>
          <Link
            to="/"
            className={cn(
              'mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border-backstitch bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90',
            )}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </HomeLayout>
  );
}

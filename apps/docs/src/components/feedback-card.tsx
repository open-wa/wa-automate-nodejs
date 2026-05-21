import { useState } from 'react';
import { cn } from '@/lib/cn';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export function FeedbackCard({ className }: { className?: string }) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className={cn("mt-12 flex flex-col sm:flex-row items-center gap-6 p-6 border-backstitch rounded-2xl bg-card shadow-stipple relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-dither opacity-[0.15] pointer-events-none" />

      <div className="relative w-48 h-48 shrink-0 rounded-2xl overflow-hidden border-2 border-foreground bg-background p-1">
        <img
          src="/wally-typing.png"
          alt="Wally the Walrus typing"
          className="w-full h-full object-cover rounded-xl m-auto"
        />
      </div>

      <div className="flex-1 text-center sm:text-left z-10">
        <h4 className="font-display font-bold text-lg mb-1 text-foreground">Was this helpful?</h4>
        <p className="text-muted-foreground text-sm">
          Wally and his cute companion coffee mug are coding day and night to keep this up-to-date!
        </p>
      </div>

      <div className="flex gap-3 z-10">
        {submitted ? (
          <p className="text-sm font-semibold text-primary">Thanks for your feedback! ❤️</p>
        ) : (
          <>
            <button
              onClick={() => setSubmitted(true)}
              className="flex items-center gap-2 px-4 py-2 bg-background hover:bg-accent border-backstitch rounded-xl hover-stipple cursor-pointer transition-all"
            >
              <ThumbsUp className="size-4 text-primary" />
              <span className="text-sm font-bold">Yes</span>
            </button>
            <button
              onClick={() => setSubmitted(true)}
              className="flex items-center gap-2 px-4 py-2 bg-background hover:bg-accent border-backstitch rounded-xl hover-stipple cursor-pointer transition-all"
            >
              <ThumbsDown className="size-4 text-destructive" />
              <span className="text-sm font-bold">No</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

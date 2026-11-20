import { useEffect, useRef, useState } from 'react';
import { GROWTH_METRICS_PREFERENCE, growthMetricsEnabled, recordGrowthEvent } from '@/lib/growth-metrics';

export function GrowthMetricsPreference({ quickstart = false }: { quickstart?: boolean }) {
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState(false);
  const quickstartRecorded = useRef(false);

  useEffect(() => {
    const refresh = () => setEnabled(growthMetricsEnabled());
    refresh();
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  useEffect(() => {
    if (!quickstart || !enabled || quickstartRecorded.current) return;
    quickstartRecorded.current = true;
    recordGrowthEvent({ event: 'quick_start_open', source: 'quickstart' });
  }, [enabled, quickstart]);

  return (
    <div className="my-4 text-sm text-fd-muted-foreground">
      <label className="inline-flex items-center gap-2">
        <input type="checkbox" checked={enabled} onChange={({ currentTarget }) => {
          try {
            window.localStorage.setItem(GROWTH_METRICS_PREFERENCE, currentTarget.checked ? 'on' : 'off');
            setEnabled(currentTarget.checked);
            setError(false);
          } catch {
            setError(true);
          }
        }} />
        Share anonymous setup metrics
      </label>
      <p className="my-1">Counts quick-start opens, setup command copies and guide clicks. Your choice applies to this browser.</p>
      {error && <p role="status">This browser couldn’t save your preference.</p>}
    </div>
  );
}

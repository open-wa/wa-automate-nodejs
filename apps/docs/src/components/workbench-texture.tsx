import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';

const Waves = lazy(() => import('./workbench-waves'));
class TextureBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

/** Decorative enhancement: never prevent the guide from loading. */
export function WorkbenchTexture() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setEnabled(!motion.matches);
    update(); motion.addEventListener('change', update);
    return () => motion.removeEventListener('change', update);
  }, []);
  return enabled ? <TextureBoundary><Suspense fallback={null}><Waves /></Suspense></TextureBoundary> : null;
}

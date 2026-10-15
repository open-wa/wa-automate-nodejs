/**
 * Runtime helpers shared by concept pages: motion preferences, the QA flags
 * (`?still`, `?capture`) and render loops that start only while on screen.
 */

const params = () => new URLSearchParams(window.location.search);

/** The user asked for reduced motion: render a designed still state. */
export const reducedMotion = (): boolean =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** `?still`: render settled, motionless frames (QA screenshots, print). */
export const still = (): boolean => params().has("still");

/** Show a still state instead of animating (reduced motion or `?still`). */
export const shouldAnimate = (): boolean => !reducedMotion() && !still();

/** `?capture`: WebGL keeps its drawing buffer so screenshots aren't blank. */
export const capture = (): boolean => params().has("capture");

/** Device pixel ratio, capped: retina phones don't need 3x shader work. */
export const dpr = (max = 2): number => Math.min(window.devicePixelRatio || 1, max);

/**
 * Calls `frame` on every animation frame while `el` is on screen and returns a
 * stop function. The loop is gated on intersection, never on
 * document.visibilityState: some embedded browsers report "hidden" while the
 * page is plainly visible, and a loop gated on it never starts. When rAF is
 * starved (throttled or background hosts), a timer renders a frame anyway so a
 * canvas never sits blank.
 */
export function whileVisible(el: Element, frame: (now: number) => void): () => void {
  let raf = 0;
  let running = false;
  let last = 0;
  const loop = (now: number) => {
    last = now;
    frame(now);
    raf = requestAnimationFrame(loop);
  };
  const io = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting && !running) {
      running = true;
      raf = requestAnimationFrame(loop);
    } else if (!entry?.isIntersecting && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  });
  io.observe(el);
  const watchdog = window.setInterval(() => {
    const now = performance.now();
    if (running && now - last > 500) {
      last = now;
      frame(now);
    }
  }, 500);
  return () => {
    io.disconnect();
    window.clearInterval(watchdog);
    cancelAnimationFrame(raf);
  };
}

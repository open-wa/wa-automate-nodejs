// Page-level behaviour: copy buttons, drafting motion for the later sheets,
// and the decision between the live WebGL drawing and the static SVG.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

const html = document.documentElement;
const reduce = html.classList.contains('rm');

// ---------- copy buttons
document.querySelectorAll<HTMLButtonElement>('button.copy').forEach((b) => {
  b.addEventListener('click', async () => {
    const text = b.dataset.copy ?? '';
    try {
      await navigator.clipboard.writeText(text);
      b.textContent = 'Copied';
    } catch {
      b.textContent = 'Select & copy';
    }
    setTimeout(() => (b.textContent = 'Copy'), 1600);
  });
});

// ---------- logo: draft once on load, again on hover/focus (CSS does the drawing)
document.querySelectorAll<HTMLElement>('.logo').forEach((logo) => {
  const replay = () => {
    logo.classList.remove('is-drafting');
    void logo.offsetWidth;
    logo.classList.add('is-drafting');
  };
  if (!reduce) {
    logo.addEventListener('pointerenter', replay);
    logo.addEventListener('focus', replay);
  }
});
if (!reduce) document.querySelector('.bar .logo')?.classList.add('is-drafting');

// ---------- drafting motion for the sheets: lines first, then lettering
if (!reduce) {
  html.classList.add('motion');
  const ease = 'power2.inOut';

  document.querySelectorAll<HTMLElement>('.sheet-head').forEach((h) => {
    gsap.from(h.querySelectorAll('h2, .sheet-sub, .sheet-no'), {
      clipPath: 'inset(0 100% 0 0)', duration: 0.7, ease: 'steps(14)', stagger: 0.12,
      scrollTrigger: { trigger: h, start: 'top 85%' },
    });
  });

  const bom = document.querySelector('.bom');
  if (bom) {
    gsap.from(bom.querySelectorAll('.bom-row'), {
      '--rule': 0, duration: 0.5, ease, stagger: 0.05,
      scrollTrigger: { trigger: bom, start: 'top 80%' },
    });
    gsap.from(bom.querySelectorAll('.bom-row > span'), {
      opacity: 0, duration: 0.25, stagger: 0.012, delay: 0.25,
      scrollTrigger: { trigger: bom, start: 'top 80%' },
    });
  }

  document.querySelectorAll<HTMLElement>('.cutview').forEach((cut) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: cut, start: 'top 78%' } });
    tl.from(cut.querySelectorAll('[data-draw]'), { drawSVG: '0%', duration: 0.7, ease, stagger: 0.1 })
      .from(cut.querySelectorAll('.cut-arrows .ah, .cut-arrows .cp, .cut-label span'), { opacity: 0, duration: 0.2, stagger: 0.05 }, '-=0.2')
      .from(cut.querySelectorAll('.iso .parts > g'), { opacity: 0, duration: 0.3, stagger: 0.012 }, 0.1)
      .from(cut.querySelectorAll('.code'), { clipPath: 'inset(0 0 100% 0)', duration: 0.6, ease, stagger: 0.15 }, 0.3);
  });

  document.querySelectorAll<HTMLElement>('[data-dim]').forEach((d) => {
    gsap.from(d, {
      '--draw': 0, duration: 1.1, ease,
      scrollTrigger: { trigger: d, start: 'top 85%' },
    });
  });

  const stamp = document.querySelector('.stamp');
  if (stamp) {
    gsap.from(stamp, {
      scale: 1.6, opacity: 0, rotate: -14, duration: 0.35, ease: 'power4.in',
      scrollTrigger: { trigger: stamp, start: 'top 80%' },
    });
  }
}

// ---------- the hero drawing
const hero = document.getElementById('drawing');
if (hero && html.classList.contains('gl-pending')) {
  import('./drawing')
    .then((m) => {
      m.initDrawing(hero);
      html.classList.remove('gl-pending');
      html.classList.add('is-live');
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    })
    .catch((err) => {
      console.warn('[blueprint] falling back to the static drawing', err);
      html.classList.remove('gl-pending');
      html.classList.add('is-static');
    });
}

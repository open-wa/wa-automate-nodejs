/**
 * The sticker studio. It renders for real with @open-wa/stickers in this page
 * (the package's browser backend uses the page's own canvas and WebP encoder),
 * so the module is loaded on first use or when the browser is idle. Until then
 * the sticker is the CLI pre-render for the default sample. Reduced motion or
 * ?still: no fly-in, instant swap.
 */
import { shouldAnimate } from "./runtime";

type StickerModule = typeof import("@open-wa/stickers");

const MAX_EFFECTS = 8;
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

/**
 * @open-wa/stickers 5.5.1 probes WebP support by calling convertToBlob on a
 * 1×1 OffscreenCanvas that never had a context. Chrome rejects that ("has no
 * rendering context"), so the browser backend reports itself unavailable. Give
 * a context-less canvas a 2D context first; canvases that have one are unchanged.
 */
function patchOffscreenProbe() {
  if (typeof OffscreenCanvas === "undefined") return;
  const proto = OffscreenCanvas.prototype as OffscreenCanvas & { __owaPatched?: boolean };
  if (proto.__owaPatched) return;
  const original = proto.convertToBlob;
  proto.convertToBlob = function (this: OffscreenCanvas, options?: ImageEncodeOptions) {
    try { this.getContext("2d"); } catch { /* another context type already owns it */ }
    return original.call(this, options);
  };
  proto.__owaPatched = true;
}

export function initStudio(root: HTMLElement) {
  const base = root.dataset.base ?? "/";
  const img = root.querySelector<HTMLImageElement>(".st-sticker")!;
  const busy = root.querySelector<HTMLElement>(".st-busy")!;
  const statusText = root.querySelector<HTMLElement>(".st-status-text")!;
  const codeEl = root.querySelector<HTMLElement>(".st-code code")!;
  const copyBtn = root.querySelector<HTMLButtonElement>(".st-copy")!;
  const chips = [...root.querySelectorAll<HTMLButtonElement>(".st-chip")];
  const stackEl = root.querySelector<HTMLOListElement>(".st-stack")!;
  const fileInput = root.querySelector<HTMLInputElement>(".st-file")!;
  const uploadLabel = root.querySelector<HTMLElement>(".st-upload")!;
  const drop = root.querySelector<HTMLElement>(".st-drop")!;
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const panel = root.querySelector<HTMLElement>(".st-panel")!;

  let stack: string[] = chips.filter((c) => c.getAttribute("aria-pressed") === "true").map((c) => c.dataset.effect!);
  let source: { id: string; file: string; bytes?: Uint8Array } = sampleFromRadio();
  let mode: "send" | "cli" = "send";
  let mod: Promise<StickerModule> | undefined;
  let renderSeq = 0;
  let debounce = 0;
  let currentUrl: string | undefined;
  const cache = new Map<string, Uint8Array>();

  const loadModule = () => (mod ??= (patchOffscreenProbe(), import("@open-wa/stickers")));

  function sampleFromRadio() {
    const r = root.querySelector<HTMLInputElement>('input[name="st-sample"]:checked');
    return { id: r?.value ?? "dog", file: r?.dataset.file ?? "photo.jpg" };
  }

  function renderStack() {
    stackEl.innerHTML = "";
    stack.forEach((name, i) => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${esc(name)}</span>`;
      const mk = (label: string, text: string, disabled: boolean, fn: () => void) => {
        const b = document.createElement("button");
        b.type = "button"; b.textContent = text; b.setAttribute("aria-label", label); b.disabled = disabled;
        b.addEventListener("click", () => { fn(); update(); const again = stackEl.querySelectorAll("li")[Math.min(i, stack.length - 1)]?.querySelector<HTMLButtonElement>(`button[aria-label^="${label.split(" ")[0]}"]:not(:disabled)`); again?.focus(); });
        return b;
      };
      li.append(
        mk(`Move ${name} earlier`, "‹", i === 0, () => { [stack[i - 1], stack[i]] = [stack[i], stack[i - 1]]; }),
        mk(`Move ${name} later`, "›", i === stack.length - 1, () => { [stack[i + 1], stack[i]] = [stack[i], stack[i + 1]]; }),
        mk(`Remove ${name}`, "×", false, () => { stack.splice(i, 1); }),
      );
      stackEl.append(li);
    });
    chips.forEach((c) => {
      const on = stack.includes(c.dataset.effect!);
      c.setAttribute("aria-pressed", String(on));
      c.disabled = !on && stack.length >= MAX_EFFECTS;
    });
  }

  function code(): { html: string; text: string } {
    const file = source.file;
    if (mode === "cli") {
      const fx = stack.length ? ` --effects ${stack.join(",")}` : "";
      const text = `npx --package @open-wa/stickers@5.5.0 openwa-sticker ${file} --output sticker.webp${fx}`;
      return { text, html: `<span class="f">npx</span> --package @open-wa/stickers@5.5.0 <span class="f">openwa-sticker</span> <span class="s">${esc(file)}</span> --output <span class="s">sticker.webp</span>${stack.length ? ` --effects <span class="s">${esc(stack.join(","))}</span>` : ""}` };
    }
    const list = stack.map((e) => `'${e}'`).join(", ");
    const text = `await client.sendSticker(chatId, './${file}', {\n  effects: [${list}],\n  pack: 'Rosa Salon',\n});`;
    const html = `<span class="k">await</span> client.<span class="f">sendSticker</span><span class="p">(</span>chatId, <span class="s">'./${esc(file)}'</span>, <span class="p">{</span>\n  effects: <span class="p">[</span>${stack.map((e) => `<span class="s">'${esc(e)}'</span>`).join(", ")}<span class="p">]</span>,\n  pack: <span class="s">'Rosa Salon'</span>,\n<span class="p">});</span>`;
    return { text, html };
  }

  function update(render = true) {
    renderStack();
    const c = code();
    codeEl.innerHTML = c.html;
    copyBtn.dataset.copy = c.text;
    if (render) {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(renderNow, 140);
    }
  }

  async function bytesFor(): Promise<Uint8Array> {
    if (source.bytes) return source.bytes;
    const hit = cache.get(source.id);
    if (hit) return hit;
    const res = await fetch(`${base}samples/${source.id}.webp`);
    const b = new Uint8Array(await res.arrayBuffer());
    cache.set(source.id, b);
    return b;
  }

  async function renderNow() {
    const seq = ++renderSeq;
    const animatedCount = stack.filter((n) => chips.find((c) => c.dataset.effect === n)?.querySelector(".st-anim")).length;
    busy.hidden = false;
    statusText.textContent = animatedCount ? "Rendering every frame in this browser…" : "Rendering in this browser…";
    try {
      const [m, input] = await Promise.all([loadModule(), bytesFor()]);
      const t0 = performance.now();
      const result = await m.createSticker(input, { effects: [...stack] });
      if (seq !== renderSeq) return;
      const ms = Math.round(performance.now() - t0);
      const url = URL.createObjectURL(new Blob([result.bytes], { type: "image/webp" }));
      await swap(url);
      const kb = Math.max(1, Math.round(result.bytes.length / 1024));
      const frames = (result as { frames?: number }).frames ?? 1;
      statusText.textContent = `Rendered here in ${ms} ms: ${kb} KB WebP, ${frames} ${frames === 1 ? "frame" : "frames"}, 512 × 512.`;
      img.alt = `Example output: the ${source.id === "upload" ? "uploaded" : source.id} photo as a sticker${stack.length ? ` with ${stack.join(", then ")}` : ""}`;
    } catch (err) {
      if (seq !== renderSeq) return;
      const message = err instanceof Error ? err.message : String(err);
      statusText.textContent = `That one didn't render (${message}). Try another photo or fewer effects.`;
    } finally {
      if (seq === renderSeq) busy.hidden = true;
    }
  }

  function swap(url: string): Promise<void> {
    return new Promise((resolve) => {
      const done = () => {
        if (currentUrl) URL.revokeObjectURL(currentUrl);
        currentUrl = url;
        if (shouldAnimate()) {
          img.classList.remove("is-landing");
          void img.offsetWidth;
          img.classList.add("is-landing");
        }
        resolve();
      };
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", () => resolve(), { once: true });
      img.src = url;
    });
  }

  // Effects
  chips.forEach((c) => c.addEventListener("click", () => {
    const name = c.dataset.effect!;
    const at = stack.indexOf(name);
    if (at >= 0) stack.splice(at, 1);
    else if (stack.length < MAX_EFFECTS) stack.push(name);
    update();
  }));

  // Samples
  root.querySelectorAll<HTMLInputElement>('input[name="st-sample"]').forEach((r) =>
    r.addEventListener("change", () => {
      uploadLabel.classList.remove("is-active");
      source = sampleFromRadio();
      update();
    }));

  // Upload and drop
  async function useFile(file: File | undefined) {
    if (!file) return;
    if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type)) { statusText.textContent = "Use a PNG, JPEG, GIF or WebP photo."; return; }
    if (file.size > 20 * 1024 * 1024) { statusText.textContent = "That photo is over 20 MB, the sticker input limit."; return; }
    const bytes = new Uint8Array(await file.arrayBuffer());
    root.querySelectorAll<HTMLInputElement>('input[name="st-sample"]').forEach((r) => (r.checked = false));
    uploadLabel.classList.add("is-active");
    const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
    source = { id: "upload", file: `photo.${ext}`, bytes };
    update();
  }
  fileInput.addEventListener("change", () => useFile(fileInput.files?.[0]));
  let depth = 0;
  root.addEventListener("dragenter", (e) => { if (e.dataTransfer?.types.includes("Files")) { e.preventDefault(); depth++; drop.hidden = false; } });
  root.addEventListener("dragover", (e) => { if (e.dataTransfer?.types.includes("Files")) e.preventDefault(); });
  root.addEventListener("dragleave", () => { depth = Math.max(0, depth - 1); if (!depth) drop.hidden = true; });
  root.addEventListener("drop", (e) => { e.preventDefault(); depth = 0; drop.hidden = true; useFile(e.dataTransfer?.files?.[0]); });

  // Tabs (arrow keys move between them)
  const selectTab = (t: HTMLButtonElement) => {
    tabs.forEach((x) => { const on = x === t; x.setAttribute("aria-selected", String(on)); x.tabIndex = on ? 0 : -1; });
    panel.setAttribute("aria-labelledby", t.id);
    mode = t.id === "st-tab-cli" ? "cli" : "send";
    update(false);
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(t));
    t.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      next.focus(); selectTab(next);
    });
  });

  update(false);
  // Warm the renderer when the page is idle, so the first change renders quickly.
  const idle = (window as any).requestIdleCallback ?? ((fn: () => void) => window.setTimeout(fn, 1200));
  idle(() => { loadModule().catch(() => {}); });
}

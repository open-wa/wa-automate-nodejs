// One delegated handler for every [data-copy] button on the page: copies the
// text, flips the button to its copied state and announces it politely.
const live = () => {
  let el = document.getElementById("copy-live");
  if (!el) {
    el = document.createElement("div");
    el.id = "copy-live";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.className = "sr-only";
    document.body.append(el);
  }
  return el;
};

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.append(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

export async function flashCopied(btn: HTMLElement, text: string) {
  const ok = await copyText(text);
  btn.dataset.state = ok ? "copied" : "failed";
  live().textContent = ok ? "Copied to clipboard" : "Copy failed. Select the text and copy it by hand.";
  window.clearTimeout(Number(btn.dataset.timer));
  btn.dataset.timer = String(window.setTimeout(() => { delete btn.dataset.state; }, 1800));
}

document.addEventListener("click", (event) => {
  const btn = (event.target as Element | null)?.closest<HTMLElement>("[data-copy]");
  if (!btn) return;
  flashCopied(btn, btn.dataset.copy ?? "");
});

// One delegated handler for every Copy button on the page. A button carries
// the text in data-copy, or points at an element with data-copy-target. The
// button shows a copied state and a polite live region announces it.
const live = () => {
  let el = document.getElementById("copy-live");
  if (!el) {
    el = document.createElement("div");
    el.id = "copy-live";
    el.className = "visually-hidden";
    el.setAttribute("aria-live", "polite");
    document.body.append(el);
  }
  return el;
};

async function write(text: string) {
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

export function initCopy() {
  document.addEventListener("click", async (event) => {
    const btn = (event.target as Element | null)?.closest<HTMLButtonElement>("button[data-copy], button[data-copy-target]");
    if (!btn) return;
    const target = btn.dataset.copyTarget ? document.getElementById(btn.dataset.copyTarget) : null;
    const text = btn.dataset.copy ?? target?.textContent ?? "";
    const ok = await write(text.trim());
    const label = btn.querySelector<HTMLElement>("[data-copy-label]");
    const original = label?.dataset.copyLabel || "Copy";
    btn.toggleAttribute("data-copied", ok);
    if (label) label.textContent = ok ? "Copied" : "Press Ctrl+C";
    live().textContent = ok ? "Copied to clipboard" : "Copy failed. Select the text and copy it.";
    window.setTimeout(() => {
      btn.removeAttribute("data-copied");
      if (label) label.textContent = original;
    }, 1800);
  });
}

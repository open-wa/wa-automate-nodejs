/**
 * One delegated handler for every copy button on the page. A button carries
 * the text in data-copy, or data-copy-from="#id" to copy an element's text.
 * It shows "Copied" for a moment and announces it to screen readers.
 */
const live = () => {
  let el = document.getElementById("copy-live");
  if (!el) {
    el = document.createElement("div");
    el.id = "copy-live";
    el.setAttribute("aria-live", "polite");
    el.className = "sr-only";
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
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

document.addEventListener("click", async (event) => {
  const btn = (event.target as Element | null)?.closest<HTMLElement>("[data-copy], [data-copy-from]");
  if (!btn) return;
  const from = btn.dataset.copyFrom;
  const text = from ? document.querySelector(from)?.textContent ?? "" : btn.dataset.copy ?? "";
  if (!text) return;
  const ok = await write(text.trim());
  const label = btn.querySelector<HTMLElement>("[data-copy-label]");
  const was = label?.textContent;
  btn.dataset.state = ok ? "copied" : "failed";
  if (label) label.textContent = ok ? "Copied" : "Press Ctrl+C";
  live().textContent = ok ? "Copied to clipboard" : "Copy failed. Select the text and copy it.";
  window.setTimeout(() => {
    delete btn.dataset.state;
    if (label && was) label.textContent = was;
  }, 1600);
});

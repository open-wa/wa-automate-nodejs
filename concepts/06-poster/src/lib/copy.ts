/**
 * Copy buttons everywhere: any [data-copy] button copies its value (or the text
 * of the element its data-copy-from names), shows "Copied" for two seconds and
 * announces it. Dispatches "openwa:copied" so the poster can reprint.
 */
const live = () => document.getElementById("live");

async function write(text: string): Promise<boolean> {
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

document.addEventListener("click", async (event) => {
  const btn = (event.target as Element | null)?.closest<HTMLButtonElement>("[data-copy]");
  if (!btn) return;
  const from = btn.dataset.copyFrom ? document.getElementById(btn.dataset.copyFrom) : null;
  const text = from ? (from.textContent ?? "").trim() : btn.dataset.copy ?? "";
  const ok = await write(text);
  const label = btn.querySelector<HTMLElement>(".copy-label") ?? btn;
  const idle = btn.dataset.idle ?? label.textContent ?? "Copy";
  btn.dataset.idle = idle;
  label.textContent = ok ? "Copied" : "Press Ctrl+C";
  btn.classList.toggle("is-copied", ok);
  const msg = live();
  if (msg) msg.textContent = ok ? "Copied to clipboard" : "Copy failed. Select the text and copy it.";
  if (ok) btn.dispatchEvent(new CustomEvent("openwa:copied", { bubbles: true }));
  window.clearTimeout(Number(btn.dataset.timer));
  btn.dataset.timer = String(window.setTimeout(() => {
    label.textContent = idle;
    btn.classList.remove("is-copied");
  }, 2200));
});

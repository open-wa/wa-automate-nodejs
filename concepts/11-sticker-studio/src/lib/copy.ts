/** Every [data-copy] button copies its text, shows "Copied" for 1.8 s and announces it. */
export function initCopy() {
  const status = document.getElementById("copy-status");
  document.addEventListener("click", async (event) => {
    const btn = (event.target as Element | null)?.closest<HTMLButtonElement>("[data-copy]");
    if (!btn) return;
    const text = btn.dataset.copy ?? "";
    let ok = true;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      ok = fallbackCopy(text);
    }
    btn.classList.toggle("is-copied", ok);
    if (status) status.textContent = ok ? "Copied to the clipboard" : "Copy failed: select the text and copy it";
    window.setTimeout(() => btn.classList.remove("is-copied"), 1800);
  });
}

function fallbackCopy(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch { ok = false; }
  area.remove();
  return ok;
}

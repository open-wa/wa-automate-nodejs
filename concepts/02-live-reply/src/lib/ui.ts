/** Site-wide behaviour: copy buttons, the phone menu sheet and tab sets. */
const announce = (msg: string) => {
  const el = document.getElementById("announcer");
  if (!el) return;
  el.textContent = "";
  window.setTimeout(() => (el.textContent = msg), 30);
};

async function copyText(text: string): Promise<boolean> {
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
    try { ok = document.execCommand("copy"); } catch {}
    ta.remove();
    return ok;
  }
}

document.addEventListener("click", async (e) => {
  const btn = (e.target as Element).closest<HTMLButtonElement>("[data-copy]");
  if (!btn) return;
  const ok = await copyText(btn.dataset.copy ?? "");
  const label = btn.querySelector(".copy-txt");
  btn.classList.toggle("is-copied", ok);
  if (label) label.textContent = ok ? "Copied" : "Press Ctrl+C";
  announce(ok ? "Copied to clipboard" : "Copy failed. Select the text and copy it.");
  window.clearTimeout(Number(btn.dataset.t));
  btn.dataset.t = String(window.setTimeout(() => {
    btn.classList.remove("is-copied");
    if (label) label.textContent = "Copy";
  }, 1800));
});

// Phone menu sheet
const menuBtn = document.querySelector<HTMLButtonElement>(".menu-btn");
const sheet = document.getElementById("menu-sheet");
if (menuBtn && sheet) {
  const set = (open: boolean) => {
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    sheet.hidden = !open;
    document.documentElement.style.overflow = open ? "hidden" : "";
  };
  menuBtn.addEventListener("click", () => set(sheet.hidden));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !sheet.hidden) { set(false); menuBtn.focus(); }
  });
}

// Tabs: [role=tablist] with buttons [role=tab][aria-controls]
for (const list of document.querySelectorAll<HTMLElement>("[role=tablist]")) {
  const tabs = [...list.querySelectorAll<HTMLButtonElement>("[role=tab]")];
  const select = (tab: HTMLButtonElement, focus = false) => {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls") ?? "");
      if (panel) panel.hidden = !on;
    }
    if (focus) tab.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(t));
    t.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
      if (e.key === "Home") { e.preventDefault(); select(tabs[0], true); }
      if (e.key === "End") { e.preventDefault(); select(tabs[tabs.length - 1], true); }
    });
  });
}

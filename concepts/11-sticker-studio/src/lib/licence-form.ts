import { submitLead } from "./leads";

/** Arabic-Indic (U+0660–0669) and Persian (U+06F0–06F9) digits become 0–9. */
export const normaliseDigits = (s: string) =>
  s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

const checks: Record<string, (v: string) => string | null> = {
  github: (v) => {
    const s = v.trim().replace(/^@/, "");
    if (!s) return "Add the GitHub username the key should be linked to.";
    if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(s)) return "GitHub usernames use letters, numbers and single hyphens, up to 39 characters.";
    return null;
  },
  phone: (v) => {
    const s = normaliseDigits(v).trim();
    if (!s) return "Add the WhatsApp number you want to license, with its country code.";
    if (/[^\d+\s()\-.]/.test(s)) return "Use digits, plus, spaces, brackets or hyphens only.";
    const digits = s.replace(/\D/g, "");
    if (!s.startsWith("+") && !s.startsWith("00")) return "Start with the country code, for example +44.";
    if (digits.length < 8 || digits.length > 15) return "That doesn't look like a full international number (8 to 15 digits).";
    return null;
  },
  useCase: (v) => (v.trim().length < 8 ? "A sentence is enough, for example: send OTP codes to new users." : null),
};
const good: Record<string, string> = { github: "Looks good.", phone: "Looks good.", useCase: "" };

export function initLicenceForm(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>("form")!;
  const done = root.querySelector<HTMLElement>(".lf-done")!;
  const submitted = new Set<string>();

  const check = (name: string, show: boolean) => {
    const wrap = form.querySelector<HTMLElement>(`[data-field="${name}"]`)!;
    const input = wrap.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea")!;
    const msg = wrap.querySelector<HTMLElement>(".lf-msg")!;
    const error = checks[name](input.value);
    if (show) {
      wrap.classList.toggle("is-bad", !!error);
      wrap.classList.toggle("is-good", !error);
      msg.textContent = error ?? good[name];
      input.setAttribute("aria-invalid", String(!!error));
    }
    return { error, input };
  };

  Object.keys(checks).forEach((name) => {
    const input = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`)!;
    input.addEventListener("input", () => {
      if (name === "phone") {
        const n = normaliseDigits(input.value);
        if (n !== input.value) input.value = n;
      }
      const { error } = check(name, false);
      // As they type: show the message once they've tried to submit, or as soon as it's valid.
      check(name, submitted.has(name) || !error);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let firstBad: HTMLElement | undefined;
    for (const name of Object.keys(checks)) {
      submitted.add(name);
      const { error, input } = check(name, true);
      if (error && !firstBad) firstBad = input;
    }
    if (firstBad) { firstBad.focus(); return; }
    const data = new FormData(form);
    const tier = String(data.get("tier"));
    const phone = normaliseDigits(String(data.get("phone"))).trim();
    const btn = form.querySelector<HTMLButtonElement>(".lf-submit")!;
    btn.disabled = true; btn.textContent = "Preparing checkout…";
    await submitLead("licence", { tier, github: String(data.get("github")).trim().replace(/^@/, ""), phone, useCase: String(data.get("useCase")).trim() });
    btn.disabled = false; btn.textContent = "Continue to checkout";
    const tierName = tier === "insiders" ? "Insiders" : "Restricted";
    done.querySelector(".lf-done-tier")!.textContent = tierName;
    done.querySelector(".lf-done-number")!.textContent = phone;
    done.querySelector<HTMLAnchorElement>(".lf-checkout")!.href = `https://openwa.dev/checkout?tier=${tier}`;
    form.hidden = true; done.hidden = false; done.focus();
  });

  done.querySelector(".lf-edit")!.addEventListener("click", () => {
    done.hidden = true; form.hidden = false;
    form.querySelector<HTMLInputElement>("input:checked")?.focus();
  });
}

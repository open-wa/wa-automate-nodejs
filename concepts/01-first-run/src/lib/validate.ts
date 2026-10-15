/** Field checks shared by the licence and support forms. Each returns an
 * error message, or "" when the value is fine. */

/** Arabic-Indic (U+0660 to U+0669) and Persian (U+06F0 to U+06F9) digits to 0-9. */
export const normaliseDigits = (v: string) =>
  v.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
   .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

export function checkGithub(v: string) {
  const s = v.trim().replace(/^@/, "");
  if (!s) return "Enter your GitHub username.";
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/.test(s))
    return "GitHub usernames use letters, numbers and single hyphens, up to 39 characters.";
  return "";
}

export function checkPhone(v: string) {
  const s = normaliseDigits(v).trim();
  if (!s) return "Enter the WhatsApp number, with its country code.";
  if (/[^\d+\s().-]/.test(s)) return "Use digits, spaces, brackets and a leading +.";
  if (/\+/.test(s.slice(1))) return "Put the + only at the start.";
  const digits = s.replace(/\D/g, "").replace(/^00/, "");
  if (digits.length < 8) return "That looks too short. Include the country code, for example +44 7700 900123.";
  if (digits.length > 15) return "That's more than 15 digits. Check the number.";
  if (!s.startsWith("+") && !s.startsWith("00") && digits.length < 10)
    return "Add the country code, for example +44 or +91.";
  return "";
}

export function checkUse(v: string) {
  const s = v.trim();
  if (!s) return "Tell us in a few words what you'll use it for.";
  if (s.length < 8) return "A few more words, please.";
  return "";
}

export function checkEmail(v: string) {
  const s = v.trim();
  if (!s) return "Enter your email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return "That email address looks incomplete.";
  return "";
}

export function checkName(v: string) {
  return v.trim() ? "" : "Enter your name.";
}

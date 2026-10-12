/**
 * A small tokenizer for the three languages the site shows (JavaScript, JSON
 * and shell). It runs at build time for static blocks and in the browser for
 * the live demo, so both look the same and no highlighter ships to the client.
 */
const KEYWORDS = new Set([
  "import", "from", "const", "let", "await", "async", "if", "else", "export", "default",
  "return", "new", "function", "true", "false", "null", "undefined",
]);

export const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const span = (cls: string, text: string) => `<span class="tk-${cls}">${escapeHtml(text)}</span>`;

function js(code: string, json = false): string {
  const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|([\s\S])/g;
  let out = "";
  let m: RegExpExecArray | null;
  let prev = "";
  while ((m = re.exec(code))) {
    const [all, comment, str, num, ident, ws, punct] = m;
    if (comment) out += span("comment", all);
    else if (str) {
      const after = code.slice(re.lastIndex).match(/^\s*:/);
      out += span(json && after ? "prop" : "string", all);
    } else if (num) out += span("number", all);
    else if (ident) {
      const next = code.slice(re.lastIndex).match(/^\s*(\(|:)/);
      if (KEYWORDS.has(ident)) out += span("keyword", all);
      else if (next?.[1] === "(") out += span("fn", all);
      else if (/^[A-Z]/.test(ident)) out += span("type", all);
      else if (prev === ".") out += span("prop", all);
      else if (next?.[1] === ":") out += span("prop", all);
      else out += escapeHtml(all);
    } else if (ws) out += all;
    else if (punct) out += span("punct", all);
    if (!ws) prev = all;
  }
  return out;
}

function shell(code: string): string {
  return code
    .split("\n")
    .map((line) => {
      const re = /("(?:[^"\\]|\\.)*"|'[^']*')|(\s--?[\w-]+)|([A-Z_]+=)|(\S+)|(\s+)/g;
      let out = "";
      let first = true;
      let m: RegExpExecArray | null;
      while ((m = re.exec(line))) {
        const [all, str, flag, env, word, ws] = m;
        if (str) out += span("string", all);
        else if (flag) out += all.startsWith(" ") ? ` ${span("flag", all.trimStart())}` : span("flag", all);
        else if (env) out += span("prop", all);
        else if (word) {
          out += first ? span("fn", all) : escapeHtml(all);
          first = false;
        } else if (ws) out += all;
      }
      return out;
    })
    .join("\n");
}

export function highlight(code: string, lang = "js"): string {
  if (lang === "bash" || lang === "sh") return shell(code);
  if (lang === "json") return js(code, true);
  if (lang === "text") return escapeHtml(code);
  return js(code);
}

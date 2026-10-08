// Tiny build-time highlighter for the few snippets on the page.
const KW = /^(import|from|const|await|async|if|export|default|new|return|true|false)$/;

export function highlight(code: string, lang: 'sh' | 'ts'): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const re = lang === 'ts'
    ? /(\/\/[^\n]*)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`[^`]*`)|\b([A-Za-z_$][\w$]*)\b|(\d+)/g
    : /(#[^\n]*)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(^|\s)(--?[\w-]+)|\b(npx|curl|docker)\b/gm;
  let out = '';
  let last = 0;
  for (const m of code.matchAll(re)) {
    out += esc(code.slice(last, m.index));
    last = m.index! + m[0].length;
    if (m[1]) out += `<span class="tk-c">${esc(m[1])}</span>`;
    else if (m[2]) out += `<span class="tk-s">${esc(m[2])}</span>`;
    else if (lang === 'ts' && m[3]) out += KW.test(m[3]) ? `<span class="tk-k">${m[3]}</span>` : esc(m[3]);
    else if (lang === 'ts' && m[4]) out += `<span class="tk-n">${m[4]}</span>`;
    else if (lang === 'sh' && m[4]) out += `${esc(m[3])}<span class="tk-f">${esc(m[4])}</span>`;
    else if (lang === 'sh' && m[5]) out += `<span class="tk-k">${m[5]}</span>`;
    else out += esc(m[0]);
  }
  return out + esc(code.slice(last));
}

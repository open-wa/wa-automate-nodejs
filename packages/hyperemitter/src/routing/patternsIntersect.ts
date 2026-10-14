/** Whether two namespace patterns share at least one concrete event name. */
export function patternsIntersect(left: string, right: string, delimiter = '.'): boolean {
  const a = left.split(delimiter), b = right.split(delimiter);
  const stack: Array<[number, number]> = [[0, 0]];
  const seen = new Set<string>();
  while (stack.length) {
    const [i, j] = stack.pop()!;
    const state = `${i}:${j}`;
    if (seen.has(state)) continue;
    seen.add(state);
    if (i === a.length && j === b.length) return true;
    if (a[i] === '**') stack.push([i + 1, j]);
    if (b[j] === '**') stack.push([i, j + 1]);
    if (i === a.length || j === b.length) continue;
    if (a[i] === b[j] || a[i] === '*' || a[i] === '**' || b[j] === '*' || b[j] === '**') {
      stack.push([a[i] === '**' ? i : i + 1, b[j] === '**' ? j : j + 1]);
    }
  }
  return false;
}

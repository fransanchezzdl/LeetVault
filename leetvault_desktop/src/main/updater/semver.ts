type Cmp = -1 | 0 | 1;

function parse(v: string): [number, number, number] | null {
  const parts = v.replace(/^v/, '').split('.').slice(0, 3).map(Number);
  if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) return null;
  return [parts[0], parts[1], parts[2]];
}

export function compareVersions(a: string, b: string): Cmp {
  const pa = parse(a);
  const pb = parse(b);
  if (!pa || !pb) return 0;
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return 1;
    if (pa[i] < pb[i]) return -1;
  }
  return 0;
}

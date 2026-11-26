export function shannonEntropy(value: string): number {
  const len = value.length;
  if (len === 0) {
    return 0;
  }
  const counts = new Map<number, number>();
  for (let i = 0; i < len; i += 1) {
    const code = value.charCodeAt(i);
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  let entropy = 0;
  for (const count of counts.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy === 0 ? 0 : entropy;
}

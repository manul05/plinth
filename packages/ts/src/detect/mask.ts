export function maskSecret(value: string): string {
  return value.length >= 16 ? `${value.slice(0, 4)}\u2026${value.slice(-2)}` : '\u2026';
}

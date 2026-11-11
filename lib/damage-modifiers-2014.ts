/** D&D 5e 2014: immunity overrides; resistance and vulnerability cancel. */
export type DamageModifier2014 = 'resistance' | 'vulnerability' | 'immunity';
export function calculateDamage2014(raw: number, modifiers: readonly DamageModifier2014[]): number {
  if (!Number.isSafeInteger(raw) || raw < 0) throw new RangeError('Invalid damage');
  if (modifiers.includes('immunity')) return 0;
  const resistant = modifiers.includes('resistance');
  const vulnerable = modifiers.includes('vulnerability');
  if (resistant === vulnerable) return raw;
  return resistant ? Math.floor(raw / 2) : raw * 2;
}

/** Colores vivos que funcionan sobre fondo claro y oscuro. */
export const PALETTE = [
  '#8B6DFF',
  '#FF6B9A',
  '#2EC5FF',
  '#22C55E',
  '#FFB547',
  '#FF7849',
  '#14B8A6',
  '#A855F7',
  '#F43F5E',
  '#64748B',
] as const;

export function colorFor(index: number) {
  return PALETTE[index % PALETTE.length];
}

/** Agrega transparencia a un color hex (#RRGGBB). */
export function withAlpha(hex: string, alpha: number) {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

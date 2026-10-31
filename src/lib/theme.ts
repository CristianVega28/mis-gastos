import { useCSSVariable } from 'uniwind';

const VARS = [
  '--color-background',
  '--color-card',
  '--color-card-2',
  '--color-border',
  '--color-foreground',
  '--color-muted',
  '--color-primary',
  '--color-primary-soft',
  '--color-on-primary',
  '--color-success',
  '--color-danger',
  '--color-warning',
] as const;

/** Colores del tema actual para props que no aceptan className (íconos, SVG). */
export function useThemeColors() {
  const [
    background,
    card,
    card2,
    border,
    foreground,
    muted,
    primary,
    primarySoft,
    onPrimary,
    success,
    danger,
    warning,
  ] = useCSSVariable([...VARS]) as string[];
  return {
    background,
    card,
    card2,
    border,
    foreground,
    muted,
    primary,
    primarySoft,
    onPrimary,
    success,
    danger,
    warning,
  };
}

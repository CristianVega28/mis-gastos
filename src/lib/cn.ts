import { twMerge } from 'tailwind-merge';

/** Une clases y resuelve conflictos (ej: `text-base` + `text-3xl` → `text-3xl`). */
export function cn(...classes: (string | false | null | undefined)[]) {
  return twMerge(classes.filter(Boolean).join(' '));
}

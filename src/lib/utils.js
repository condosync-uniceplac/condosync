/**
 * Junta classes CSS do Tailwind, resolvendo conflitos (ex.: 'p-2' e 'p-4' -> fica a última).
 */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

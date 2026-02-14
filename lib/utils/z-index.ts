import { Z_INDEX } from '../constants/z-index'

export type ZIndexKey = keyof typeof Z_INDEX

export function getZIndex(key: ZIndexKey): number {
  return Z_INDEX[key]
}

// Tailwind JIT will not generate classes for dynamic arbitrary values like `z-[${n}]`.
// To ensure classes are included in the build, map explicit numeric values to literal classes.
const Z_INDEX_TO_CLASS: Record<number, string> = {
  0: 'z-0',
  20: 'z-[20]',
  40: 'z-[40]',
  45: 'z-[45]',
  50: 'z-50',
  51: 'z-[51]',
  52: 'z-[52]',
  90: 'z-[90]',
  95: 'z-[95]',
  100: 'z-[100]',
  110: 'z-[110]',
  120: 'z-[120]',
  950: 'z-[950]',
  960: 'z-[960]',
  999: 'z-[999]',
  1000: 'z-[1000]',
  1100: 'z-[1100]',
}

export function getZIndexClass(key: ZIndexKey): string {
  const value = Z_INDEX[key]
  return Z_INDEX_TO_CLASS[value] || 'z-auto'
}
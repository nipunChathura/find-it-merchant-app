/**
 * 8px grid system
 */

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  page: 16,
} as const;

/** Same horizontal padding for all pages and modal content — consistent width */
export const layout = {
  contentPaddingHorizontal: 16,
  modalMaxWidth: 400,
  modalBorderRadius: 20,
  modalPadding: 16,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const cardRadius = 16;
export const inputRadius = 12;

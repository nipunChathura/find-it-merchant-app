/**
 * Modern Blue Theme — Safe & Professional
 * Best for: Business apps, Admin panels, Finance apps
 */

import { Platform } from 'react-native';

// Light theme
const primary = '#2563EB';      // Blue 600
const secondary = '#1E40AF';    // Blue 800
const backgroundLight = '#F8FAFC';
const textPrimaryLight = '#0F172A';
const accent = '#38BDF8';       // Sky 400

// Dark theme (derived)
const backgroundDark = '#0F172A';
const textPrimaryDark = '#F8FAFC';
const iconDark = '#94A3B8';

export const Colors = {
  light: {
    text: textPrimaryLight,
    background: backgroundLight,
    tint: primary,
    secondary,
    accent,
    icon: '#64748B',
    tabIconDefault: '#64748B',
    tabIconSelected: primary,
    border: '#E2E8F0',
  },
  dark: {
    text: textPrimaryDark,
    background: backgroundDark,
    tint: accent,
    secondary: '#60A5FA',
    accent,
    icon: iconDark,
    tabIconDefault: iconDark,
    tabIconSelected: accent,
    border: '#334155',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

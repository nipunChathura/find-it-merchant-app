import { Colors } from '@/constants/theme';

/** Always uses light theme. Dark theme has been removed. */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light
) {
  const colorFromProps = props.light;
  if (colorFromProps) return colorFromProps;
  return Colors.light[colorName];
}

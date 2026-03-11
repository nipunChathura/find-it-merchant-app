import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

import { colors } from '@/theme/colors';
import { inputRadius, spacing } from '@/theme/spacing';
import { fontSizes } from '@/theme/typography';

export interface AppInputProps extends TextInputProps {
  error?: boolean;
}

export function AppInput({ style, error, ...props }: AppInputProps) {
  return (
    <TextInput
      style={[
        styles.input,
        error && styles.inputError,
        style,
      ]}
      placeholderTextColor={colors.textSecondary}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: inputRadius,
    paddingHorizontal: spacing.lg,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    backgroundColor: colors.card,
  },
  inputError: {
    borderColor: colors.error,
  },
});

import React from 'react';
import { ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { layout, spacing } from '@/theme/spacing';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollEnabled?: boolean;
}

export function ScreenContainer({
  children,
  style,
  scrollEnabled = true,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top, spacing.sm),
          paddingBottom: Math.max(insets.bottom, spacing.xxxl),
        },
      ]}
      showsVerticalScrollIndicator={false}
      scrollEnabled={scrollEnabled}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: layout.contentPaddingHorizontal,
    paddingTop: spacing.page,
    paddingBottom: spacing.xxxl,
  },
});

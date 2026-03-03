import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { colors } from '@/theme/colors';
import { cardRadius, spacing } from '@/theme/spacing';

export function SummaryCardSkeleton() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.bar} />
      <View style={styles.body}>
        <View style={styles.iconPlaceholder} />
        <View style={styles.lineShort} />
        <View style={styles.lineLong} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: cardRadius,
    overflow: 'hidden',
    minHeight: 120,
  },
  bar: {
    height: 3,
    backgroundColor: colors.border,
    width: '100%',
  },
  body: {
    padding: spacing.lg,
  },
  iconPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  lineShort: {
    height: 12,
    width: '60%',
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  lineLong: {
    height: 24,
    width: '40%',
    backgroundColor: colors.border,
    borderRadius: 4,
  },
});

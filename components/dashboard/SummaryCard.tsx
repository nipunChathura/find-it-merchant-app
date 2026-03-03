import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { cardRadius, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
}

export function SummaryCard({
  title,
  value,
  subtext,
  icon,
}: SummaryCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <MaterialIcons name={icon} size={24} color={colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
        {subtext ? <Text style={styles.subtext}>{subtext}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: cardRadius,
    overflow: 'hidden',
    minHeight: 120,
    ...shadow,
  },
  accentBar: {
    height: 3,
    backgroundColor: colors.primary,
    width: '100%',
  },
  body: {
    padding: spacing.lg,
  },
  iconWrap: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  subtext: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

const shadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
  default: {},
});

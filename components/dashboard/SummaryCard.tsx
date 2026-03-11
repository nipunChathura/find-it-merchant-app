import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
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
          <MaterialIcons name={icon} size={22} color={colors.primary} />
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
    borderRadius: 18,
    overflow: 'hidden',
    minHeight: 128,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  accentBar: {
    height: 4,
    width: '100%',
    backgroundColor: colors.textSecondary,
  },
  body: {
    padding: spacing.lg,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 28,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
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

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { cardRadius, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';
import type { Outlet, OutletStatus, PaymentStatus } from '@/types';

interface OutletCardProps {
  outlet: Outlet;
  onPress?: () => void;
}

const statusConfig: Record<
  OutletStatus,
  { label: string; bg: string; text: string }
> = {
  OPEN: { label: 'Open', bg: colors.successBg, text: colors.success },
  CLOSED: { label: 'Closed', bg: colors.errorBg, text: colors.error },
};

const paymentConfig: Record<
  PaymentStatus,
  { label: string; bg: string; text: string }
> = {
  PAID: { label: 'Paid', bg: colors.successBg, text: colors.success },
  PENDING: { label: 'Pending', bg: colors.warningBg, text: colors.warning },
  OVERDUE: { label: 'Overdue', bg: colors.errorBg, text: colors.error },
};

export function OutletCard({ outlet, onPress }: OutletCardProps) {
  const statusStyle = statusConfig[outlet.status];
  const paymentStyle = paymentConfig[outlet.paymentStatus];

  const content = (
    <>
      <View style={styles.main}>
        <Text style={styles.name} numberOfLines={1}>
          {outlet.name}
        </Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>
              {statusStyle.label}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: paymentStyle.bg }]}>
            <Text style={[styles.badgeText, { color: paymentStyle.text }]}>
              {paymentStyle.label}
            </Text>
          </View>
        </View>
        <Text style={styles.items}>{outlet.totalItems} items</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: cardRadius,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    opacity: 0.95,
  },
  main: {
    flex: 1,
  },
  name: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  items: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
});

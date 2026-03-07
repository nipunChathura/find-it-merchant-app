import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState, ScreenContainer } from '@/components/dashboard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { colors } from '@/theme/colors';
import { borderRadius, cardRadius, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';

const headerShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  android: { elevation: 3 },
  default: {},
});

/** Payments list from dashboard API */
export default function PaymentsScreen() {
  const router = useRouter();
  const { payments = [] } = useDashboardData();

  const sortedPayments = useMemo(() => {
    const list = Array.isArray(payments) ? payments : [];
    return [...list].sort((a, b) => {
      const keyA = `${a.paidMonth ?? ''}-${a.paymentDate ?? ''}`;
      const keyB = `${b.paidMonth ?? ''}-${b.paymentDate ?? ''}`;
      return keyB.localeCompare(keyA);
    });
  }, [payments]);

  return (
    <ScreenContainer>
      <View style={styles.section}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Payments</Text>
          <Pressable
            onPress={() => router.push('/(tabs)/payments/submit')}
            style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
          >
            <Text style={styles.addButtonText}>Submit Payment</Text>
          </Pressable>
        </View>
        {sortedPayments.length === 0 ? (
          <EmptyState
            icon="payment"
            title="No payments yet"
            message="Submit a payment for an outlet to record it here."
          />
        ) : (
          sortedPayments.map((p, idx) => (
            <View key={p.paymentId ? `payment-${p.paymentId}` : `payment-${idx}`} style={styles.card}>
              <Text style={styles.cardTitle}>{p.outletName}</Text>
              <Text style={styles.cardMonth}>{p.paidMonth}{p.paymentDate ? ` · ${p.paymentDate}` : ''}</Text>
              <Text style={styles.cardAmount}>LKR {Number(p.amount).toLocaleString()}</Text>
              {p.paymentStatus ? (
                <Text style={styles.cardStatus}>{p.paymentStatus}</Text>
              ) : null}
            </View>
          ))
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: { flex: 1, marginBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginHorizontal: -spacing.page,
    marginBottom: spacing.xl,
    borderBottomLeftRadius: cardRadius,
    borderBottomRightRadius: cardRadius,
    ...headerShadow,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.white,
    letterSpacing: 0.3,
  },
  addButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  addButtonPressed: { opacity: 0.9 },
  addButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: fontSizes.base, fontWeight: fontWeights.semibold, color: colors.textPrimary },
  cardMonth: { fontSize: fontSizes.sm, color: colors.textSecondary, marginTop: 2 },
  cardAmount: { fontSize: fontSizes.lg, fontWeight: fontWeights.bold, color: colors.primary, marginTop: 4 },
  cardStatus: { fontSize: fontSizes.xs, color: colors.textSecondary, marginTop: 2 },
});

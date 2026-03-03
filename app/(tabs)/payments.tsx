import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EmptyState, ScreenContainer } from '@/components/dashboard';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';

export default function PaymentsScreen() {
  return (
    <ScreenContainer>
      <View style={styles.section}>
        <Text style={styles.title}>Payments</Text>
        <EmptyState
          icon="payment"
          title="No payments yet"
          message="Your payment history will appear here."
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
});

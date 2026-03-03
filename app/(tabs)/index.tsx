import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
    ActionButton,
    EmptyState,
    NotificationItem,
    OutletCard,
    ScreenContainer,
    SectionHeader,
    SummaryCard,
    SummaryCardSkeleton,
} from '@/components/dashboard';
import { useAuth } from '@/context/auth-context';
import { useDashboardData } from '@/hooks/useDashboardData';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    summary,
    outlets,
    notifications,
    loading,
    refreshing,
    refresh,
    role,
  } = useDashboardData();

  const displayName = user?.username ?? 'Merchant';

  return (
    <ScreenContainer
      refreshing={refreshing}
      onRefresh={refresh}
    >
      {/* 1. Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcome} numberOfLines={1}>Find It Merchant</Text>
          <Text style={styles.subtitle}>Today's overview</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.iconButton}>
            <MaterialIcons name="notifications" size={24} color={colors.textPrimary} />
            <View style={styles.badge} />
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Summary Cards (2x2) */}
      <View style={styles.section}>
        {loading ? (
          <View style={styles.grid}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.gridItem}>
                <SummaryCardSkeleton />
              </View>
            ))}
          </View>
        ) : summary ? (
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <SummaryCard
                title="Total Outlets"
                value={summary.totalOutlets}
                subtext={role === 'SUBMERCHANT' ? 'Assigned to you' : 'All outlets'}
                icon="store"
              />
            </View>
            <View style={styles.gridItem}>
              <SummaryCard
                title="Active Outlets"
                value={summary.activeOutlets}
                subtext="Currently open"
                icon="check-circle"
              />
            </View>
            <View style={styles.gridItem}>
              <SummaryCard
                title="Total Items"
                value={summary.totalItems}
                subtext="Across outlets"
                icon="inventory"
              />
            </View>
            <View style={styles.gridItem}>
              <SummaryCard
                title="Pending Payments"
                value={summary.pendingPayments}
                subtext="Requires action"
                icon="payment"
              />
            </View>
          </View>
        ) : null}
      </View>

      {/* 3. Quick Actions */}
      <View style={styles.section}>
        <SectionHeader title="Quick Actions" />
        <View style={styles.actionsRow}>
          <ActionButton
            label="Add New Outlet"
            icon="add-business"
            onPress={() => {}}
            primary
          />
          <ActionButton
            label="Manage Items"
            icon="inventory-2"
            onPress={() => {}}
          />
        </View>
        <View style={styles.actionsRow}>
          <ActionButton
            label="Manage Schedule"
            icon="schedule"
            onPress={() => {}}
          />
          <ActionButton
            label="Make Payment"
            icon="payment"
            onPress={() => {}}
          />
        </View>
      </View>

      {/* 4. Outlet Preview */}
      <View style={styles.section}>
        <SectionHeader
          title="Outlets"
          actionLabel="View All"
          onAction={() => router.push('/(tabs)/outlets')}
        />
        {loading ? (
          <View style={styles.outletPlaceholder} />
        ) : outlets.length === 0 ? (
          <EmptyState
            icon="store"
            title="No outlets"
            message={
              role === 'SUBMERCHANT'
                ? 'No outlets assigned to you yet.'
                : 'Add your first outlet to get started.'
            }
          />
        ) : (
          outlets.map((outlet) => (
            <OutletCard
              key={outlet.id}
              outlet={outlet}
              onPress={() => {}}
            />
          ))
        )}
      </View>

      {/* 5. Recent Notifications */}
      <View style={styles.section}>
        <SectionHeader
          title="Recent Notifications"
          actionLabel="View All"
          onAction={() => {}}
        />
        {loading ? (
          <View style={styles.notifPlaceholder} />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="notifications"
            title="No notifications"
            message="You're all caught up."
          />
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    minHeight: 48,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
  },
  welcome: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  iconButton: {
    position: 'relative',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  gridItem: {
    width: '48%',
    marginBottom: spacing.sm,
    marginHorizontal: '1%',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  outletPlaceholder: {
    height: 200,
  },
  notifPlaceholder: {
    height: 120,
  },
});

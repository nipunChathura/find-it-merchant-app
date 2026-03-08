import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    ActionButton,
    EmptyState,
    NotificationItem,
    OutletCard,
    SectionHeader,
    SummaryCard,
} from '@/components/dashboard';
import { useAuth } from '@/context/auth-context';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useRole } from '@/hooks/useRole';
import { fetchAssignedOutlets } from '@/services/outletService';
import { colors } from '@/theme/colors';
import { layout, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';
import type { Outlet } from '@/types';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const role = useRole();
  const { summary: apiSummary, notifications, unreadNotificationCount, refresh } = useDashboardData();
  const [pendingPaymentsModalVisible, setPendingPaymentsModalVisible] = useState(false);
  /** Outlet list from same API as All Outlets page (GET /api/outlets/assigned) so status matches */
  const [outlets, setOutlets] = useState<Outlet[]>([]);

  const displayName = user?.username ?? 'Merchant';

  /** Overview section uses API data (GET /api/merchant-app/dashboard) */
  const summary = apiSummary ?? {
    totalOutlets: 0,
    activeOutlets: 0,
    totalItems: 0,
    pendingPayments: 0,
  };

  const loadOutlets = useCallback(async () => {
    const merchantId = user?.merchantId;
    const subMerchantId = user?.subMerchantId;
    if (role === 'MERCHANT' && merchantId != null) {
      const list = await fetchAssignedOutlets({ merchantId });
      setOutlets(list);
    } else if (role === 'SUBMERCHANT' && subMerchantId != null) {
      const list = await fetchAssignedOutlets({ subMerchantId });
      setOutlets(list);
    } else {
      setOutlets([]);
    }
  }, [role, user?.merchantId, user?.subMerchantId]);

  useEffect(() => {
    loadOutlets();
  }, [loadOutlets]);

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      {/* 1. Top bar - fixed, below status bar */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require('@/assets/images/logo.jpg')}
            style={styles.headerLogo}
            contentFit="cover"
          />
          <Text style={styles.headerTitle} numberOfLines={1}>Find It</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            onPress={() => router.push('/(tabs)/notifications')}
          >
            <MaterialIcons name="notifications" size={24} color={colors.white} />
            {unreadNotificationCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText} numberOfLines={1}>
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.logoutBtn, pressed && styles.iconButtonPressed]}
            onPress={async () => {
              await signOut();
              router.replace('/login');
            }}
          >
            <MaterialIcons name="logout" size={24} color={colors.white} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      {/* Today's overview - below top bar */}
      <Text style={styles.overviewLabel}>Today's overview</Text>

      {/* 2. Summary Cards (2x2) */}
      <View style={styles.section}>
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
            <Pressable
              style={({ pressed }) => [pressed && styles.cardPressed]}
              onPress={() => setPendingPaymentsModalVisible(true)}
            >
              <SummaryCard
                title="Pending Payments"
                value={summary.pendingPayments}
                subtext="Requires action"
                icon="payment"
                accentColor={colors.yellow}
              />
            </Pressable>
          </View>
        </View>
      </View>

      <Modal
        visible={pendingPaymentsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingPaymentsModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setPendingPaymentsModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalHeaderIconWrap}>
                  <MaterialIcons name="payment" size={22} color={colors.white} />
                </View>
                <Text style={styles.modalTitle}>Pending payment details</Text>
              </View>
              <Pressable
                onPress={() => setPendingPaymentsModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={12}
              >
                <MaterialIcons name="close" size={24} color={colors.white} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {(apiSummary?.pendingPaymentDetails?.length ?? 0) === 0 ? (
                <View style={styles.modalEmptyWrap}>
                  <MaterialIcons name="receipt-long" size={48} color={colors.textSecondary} />
                  <Text style={styles.modalEmpty}>No pending payments</Text>
                  <Text style={styles.modalEmptySub}>Payments from API will appear here.</Text>
                </View>
              ) : (
                (apiSummary?.pendingPaymentDetails ?? []).map((p: PendingPaymentDetail, idx: number) => (
                  <View key={p.paymentId ? `pay-${p.paymentId}` : `pay-${idx}`} style={styles.paymentCard}>
                    <View style={styles.paymentCardAccent} />
                    <View style={styles.paymentCardBody}>
                      <View style={styles.paymentRowTop}>
                        <MaterialIcons name="store" size={20} color={colors.primary} />
                        <Text style={styles.paymentOutlet}>{p.outletName}</Text>
                      </View>
                      <Text style={styles.paymentAmount}>LKR {Number(p.amount).toLocaleString()}</Text>
                      <View style={styles.paymentMetaRow}>
                        <MaterialIcons name="calendar-today" size={14} color={colors.textSecondary} />
                        <Text style={styles.paymentMeta}>
                          {p.paidMonth}{p.paymentDate ? ` · ${p.paymentDate}` : ''}
                        </Text>
                      </View>
                      <View style={styles.paymentStatusWrap}>
                        <View style={styles.paymentStatusBadge}>
                          <Text style={styles.paymentStatusText}>{p.paymentStatus}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 3. Quick Actions */}
      <View style={styles.section}>
        <SectionHeader title="Quick Actions" />
        <View style={styles.actionsCard}>
        <View style={styles.actionsColumn}>
          {role === 'MERCHANT' && (
            <>
              <View style={styles.actionItem}>
                <ActionButton
                  label="Add New Outlet"
                  icon="add-business"
                  onPress={() => router.push('/(tabs)/outlets/add')}
                  primary
                />
              </View>
              <View style={styles.actionItem}>
                <ActionButton
                  label="Add Sub Merchant"
                  icon="person-add"
                  onPress={() => router.navigate('/(tabs)/sub-merchants/add' as const)}
                />
              </View>
            </>
          )}
          <View style={styles.actionItem}>
            <ActionButton
              label="Manage Schedule"
              icon="schedule"
              onPress={() => router.push('/(tabs)/outlets')}
            />
          </View>
          <View style={styles.actionItem}>
            <ActionButton
              label="Make Payment"
              icon="payment"
              onPress={() => router.push('/(tabs)/payments/submit')}
            />
          </View>
        </View>
        </View>
      </View>

      {/* 4. Outlet Preview */}
      <View style={styles.section}>
        <SectionHeader
          title="Outlets"
          actionLabel="View All"
          onAction={() => router.navigate('/(tabs)/outlets')}
        />
        <View style={styles.outletsCard}>
        {outlets.length === 0 ? (
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
          outlets.slice(0, 2).map((outlet, idx) => (
            <OutletCard
              key={outlet?.id ?? `outlet-${idx}`}
              outlet={outlet}
              onPress={() => router.push(`/(tabs)/outlets/${outlet.id}`)}
            />
          ))
        )}
        </View>
      </View>

      {/* 5. Recent Notifications */}
      <View style={styles.section}>
        <SectionHeader
          title="Recent Notifications"
          actionLabel="View All"
          onAction={() => router.push('/(tabs)/notifications')}
        />
        <View style={styles.notifCard}>
        {notifications.length === 0 ? (
          <EmptyState
            icon="notifications"
            title="No notifications"
            message="You're all caught up."
          />
        ) : (
          notifications.map((n, idx) => (
            <NotificationItem key={n?.id ?? `notif-${idx}`} notification={n} />
          ))
        )}
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  android: { elevation: 4 },
  default: {},
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.contentPaddingHorizontal,
    paddingTop: spacing.page,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.page,
    backgroundColor: colors.primary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: fontWeights.bold,
    color: colors.white,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
  },
  iconButton: {
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewLabel: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  iconButtonPressed: {
    opacity: 0.8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  logoutBtn: {
    width: 44,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xxl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 20,
    ...cardShadow,
  },
  heroContent: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xxs,
  },
  welcome: {
    fontSize: 26,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: {
    width: '48%',
  },
  cardPressed: {
    opacity: 0.9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: layout.contentPaddingHorizontal,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: layout.modalBorderRadius,
    width: '100%',
    maxWidth: layout.modalMaxWidth,
    maxHeight: '80%',
    overflow: 'hidden',
    ...cardShadow,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: layout.modalPadding,
    backgroundColor: colors.primary,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  modalHeaderIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  modalCloseBtn: {
    padding: spacing.xs,
  },
  modalScroll: {
    padding: layout.modalPadding,
    maxHeight: 400,
    backgroundColor: colors.background,
  },
  modalEmptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  modalEmpty: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  modalEmptySub: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  paymentCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  paymentCardAccent: {
    height: 4,
    width: '100%',
    backgroundColor: colors.warning,
  },
  paymentCardBody: {
    padding: spacing.lg,
  },
  paymentRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  paymentOutlet: {
    flex: 1,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  paymentAmount: {
    fontSize: 22,
    fontWeight: fontWeights.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  paymentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  paymentMeta: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  paymentStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  paymentStatusBadge: {
    backgroundColor: colors.warningBg,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  paymentStatusText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.warning,
    textTransform: 'uppercase',
  },
  actionsCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.lg,
    ...cardShadow,
  },
  actionsColumn: {
    flexDirection: 'column',
    gap: spacing.md,
  },
  actionItem: {
    width: '100%',
  },
  outletsCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.lg,
    ...cardShadow,
  },
  notifCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.lg,
    ...cardShadow,
  },
});

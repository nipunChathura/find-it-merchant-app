import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SecondaryButton } from '@/components/ui/SecondaryButton';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useRole } from '@/hooks/useRole';
import {
    approveSubMerchant,
    deleteSubMerchant,
    rejectSubMerchant,
} from '@/services/subMerchantService';
import { colors } from '@/theme/colors';
import { borderRadius, cardRadius, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';
import type { SubMerchantItem } from '@/types/dashboard';

function getStatusStyle(status: string): { bg: string; text: string } {
  const s = (status || '').toUpperCase();
  if (s === 'ACTIVE' || s === 'APPROVED') return { bg: colors.successBg, text: colors.success };
  if (s === 'PENDING' || s === 'INACTIVE') return { bg: colors.warningBg, text: colors.warning };
  return { bg: colors.errorBg, text: colors.error };
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: string | null | undefined;
}) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.detailRow}>
      <MaterialIcons name={icon} size={20} color={colors.textSecondary} />
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function SubMerchantDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const role = useRole();
  const { subMerchants, refresh } = useDashboardData();
  const [actionLoading, setActionLoading] = useState(false);

  const subMerchantId = id != null ? parseInt(id, 10) : NaN;
  const item: SubMerchantItem | undefined =
    Number.isNaN(subMerchantId) ? undefined : subMerchants.find((sm) => sm.subMerchantId === subMerchantId);

  if (role !== 'MERCHANT') {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={12}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Sub Merchant Details</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Only main merchants can view sub merchant details.</Text>
        </View>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={12}>
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Sub Merchant Details</Text>
        </View>
        <View style={styles.empty}>
          <MaterialIcons name="person-off" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Sub merchant not found.</Text>
        </View>
      </View>
    );
  }

  const statusStyle = getStatusStyle(item.subMerchantStatus);
  const initial = (item.merchantName || item.merchantEmail || 'M').trim().charAt(0).toUpperCase() || 'M';
  const isPending = (item.subMerchantStatus || '').toUpperCase() === 'PENDING';
  const isMerchant = role === 'MERCHANT';

  const handleDelete = () => {
    Alert.alert(
      'Delete Sub Merchant',
      `Remove "${item.merchantName || 'this sub merchant'}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await deleteSubMerchant(item.subMerchantId);
              refresh();
              router.back();
            } catch (e: unknown) {
              const msg =
                e && typeof e === 'object' && 'response' in e
                  ? (e as { response?: { data?: { responseMessage?: string } } }).response?.data
                      ?.responseMessage
                  : null;
              Alert.alert('Error', msg || 'Failed to delete sub merchant.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await approveSubMerchant(item.subMerchantId);
      refresh();
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? (e as { response?: { data?: { responseMessage?: string } } }).response?.data
              ?.responseMessage
          : null;
      Alert.alert('Error', msg || 'Failed to approve.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    Alert.alert(
      'Reject Sub Merchant',
      `Reject "${item.merchantName || 'this sub merchant'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await rejectSubMerchant(item.subMerchantId);
              refresh();
            } catch (e: unknown) {
              const msg =
                e && typeof e === 'object' && 'response' in e
                  ? (e as { response?: { data?: { responseMessage?: string } } }).response?.data
                      ?.responseMessage
                  : null;
              Alert.alert('Error', msg || 'Failed to reject.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{initial}</Text>
          </View>
          <Text style={styles.heroName}>{item.merchantName || '—'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
              {item.subMerchantStatus}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardAccent} />
          <View style={styles.cardInner}>
            <View style={styles.sectionLabel}>
              <MaterialIcons name="contact-mail" size={20} color={colors.primary} />
              <Text style={styles.sectionLabelText}>Contact</Text>
            </View>
            <DetailRow icon="email" label="Email" value={item.merchantEmail} />
            <DetailRow icon="phone-android" label="Phone" value={item.merchantPhoneNumber} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardAccent} />
          <View style={styles.cardInner}>
            <View style={styles.sectionLabel}>
              <MaterialIcons name="location-on" size={20} color={colors.primary} />
              <Text style={styles.sectionLabelText}>Address</Text>
            </View>
            <DetailRow icon="place" label="Address" value={item.merchantAddress || undefined} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardAccent} />
          <View style={styles.cardInner}>
            <View style={styles.sectionLabel}>
              <MaterialIcons name="business" size={20} color={colors.primary} />
              <Text style={styles.sectionLabelText}>Info</Text>
            </View>
            <DetailRow icon="people" label="Parent merchant" value={item.parentMerchantName || undefined} />
            <DetailRow icon="badge" label="Merchant type" value={item.merchantType || undefined} />
            <DetailRow icon="fingerprint" label="NIC" value={item.merchantNic || undefined} />
          </View>
        </View>

        {isMerchant ? (
          <View style={styles.card}>
            <View style={styles.cardAccent} />
            <View style={styles.cardInner}>
              <View style={styles.sectionLabel}>
                <MaterialIcons name="tune" size={20} color={colors.primary} />
                <Text style={styles.sectionLabelText}>Actions</Text>
              </View>
              <Pressable
                onPress={() => router.push({ pathname: '/(tabs)/sub-merchants/edit', params: { id: String(item.subMerchantId) } })}
                style={styles.actionRow}
                disabled={actionLoading}
              >
                <MaterialIcons name="edit" size={22} color={colors.primary} />
                <Text style={styles.actionText}>Change details</Text>
                <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
              </Pressable>
              {isPending ? (
                <View style={styles.pendingActions}>
                  <View style={styles.pendingActionBtn}>
                    <PrimaryButton
                      title={actionLoading ? 'Approving…' : 'Approve'}
                      onPress={handleApprove}
                      loading={actionLoading}
                      disabled={actionLoading}
                    />
                  </View>
                  <View style={styles.pendingActionBtn}>
                    <SecondaryButton
                      title="Reject"
                      onPress={handleReject}
                      disabled={actionLoading}
                    />
                  </View>
                </View>
              ) : null}
              <View style={styles.deleteWrap}>
                <Pressable
                  onPress={handleDelete}
                  style={styles.deleteButton}
                  disabled={actionLoading}
                >
                  <MaterialIcons name="delete-outline" size={22} color={colors.error} />
                  <Text style={styles.deleteText}>Delete sub merchant</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: spacing.page,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.page,
    paddingBottom: spacing.xxxl,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: cardRadius,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarLargeText: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  heroName: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: cardRadius,
    marginBottom: spacing.md,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardAccent: {
    width: 4,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  cardInner: {
    flex: 1,
    padding: spacing.lg,
  },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionLabelText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  detailText: {
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionText: {
    flex: 1,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    color: colors.textPrimary,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  pendingActionBtn: {
    flex: 1,
  },
  deleteWrap: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deleteText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    color: colors.error,
  },
});

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthImage } from '@/components/ui/AuthImage';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAuth } from '@/context/auth-context';
import { deleteDiscount, type OutletDiscountDetail } from '@/services/discountService';
import { colors } from '@/theme/colors';
import { borderRadius, layout, spacing } from '@/theme/spacing';

function parseDiscountFromParams(data?: string | null): OutletDiscountDetail | null {
  if (!data || typeof data !== 'string') return null;
  try {
    const parsed = JSON.parse(data) as OutletDiscountDetail;
    return parsed && typeof parsed.discountId === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

export default function DiscountDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const params = useLocalSearchParams<{ outletId?: string; discountData?: string }>();

  const discount = parseDiscountFromParams(params.discountData);

  if (!discount) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.errorBlock}>
          <MaterialIcons name="error-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.errorText}>Discount not found.</Text>
        </View>
      </View>
    );
  }

  const valueText =
    discount.discountType === 'PERCENTAGE'
      ? `${discount.discountValue}% off`
      : `LKR ${Number(discount.discountValue).toLocaleString()} off`;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, spacing.sm) }]}>
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
        {/* Hero image - GET /api/images/show?type=discount&fileName=... */}
        <View style={styles.heroImageWrap}>
          {discount.discountImage && token ? (
            <AuthImage
              type="discount"
              fileName={discount.discountImage}
              token={token}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <MaterialIcons name="local-offer" size={64} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{discount.discountStatus ?? '—'}</Text>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>{discount.discountName ?? `Discount #${discount.discountId}`}</Text>
          <Text style={styles.value}>{valueText}</Text>
        </View>

        {(discount.startDate || discount.endDate) ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Valid period</Text>
            <Text style={styles.cardValue}>
              {discount.startDate && discount.endDate
                ? `${discount.startDate} – ${discount.endDate}`
                : discount.startDate ?? discount.endDate ?? '—'}
            </Text>
          </View>
        ) : null}

        {discount.outletName ? (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <MaterialIcons name="store" size={20} color={colors.primary} />
              <Text style={styles.cardLabel}>Outlet</Text>
            </View>
            <Text style={styles.cardValue}>{discount.outletName}</Text>
          </View>
        ) : null}

        {discount.items?.length ? (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <MaterialIcons name="inventory" size={20} color={colors.primary} />
              <Text style={styles.cardLabel}>Items</Text>
            </View>
            <Text style={styles.cardValue}>
              {discount.items.map((i) => i.itemName ?? `#${i.itemId}`).join(', ')}
            </Text>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Discount ID: {discount.discountId}</Text>
          {discount.outletId ? <Text style={styles.metaText}>Outlet ID: {discount.outletId}</Text> : null}
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            title="Edit discount"
            onPress={() =>
              router.push({
                pathname: '/(tabs)/outlets/discounts/edit',
                params: {
                  outletId: params.outletId ?? String(discount.outletId ?? ''),
                  discountData: JSON.stringify(discount),
                },
              })
            }
            style={styles.editBtn}
          />
          <Pressable
            onPress={() => {
              Alert.alert(
                'Delete discount',
                `Delete "${discount.discountName ?? 'this discount'}"?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await deleteDiscount(discount.discountId);
                        router.back();
                      } catch {
                        Alert.alert('Error', 'Failed to delete discount.');
                      }
                    },
                  },
                ]
              );
            }}
            style={styles.deleteBtn}
          >
            <MaterialIcons name="delete-outline" size={22} color={colors.error} />
            <Text style={styles.deleteBtnText}>Delete discount</Text>
          </Pressable>
        </View>

        <View style={{ height: spacing.xxl * 2 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: layout.contentPaddingHorizontal,
    paddingBottom: spacing.sm,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: layout.contentPaddingHorizontal,
    paddingBottom: spacing.xxl,
  },
  heroImageWrap: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  titleBlock: { marginBottom: spacing.lg },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  editBtn: { marginBottom: spacing.xs },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error + '88',
  },
  deleteBtnText: { fontSize: 16, fontWeight: '600', color: colors.error },
  errorBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});

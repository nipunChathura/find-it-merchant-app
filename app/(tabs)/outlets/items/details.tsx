import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthImage } from '@/components/ui/AuthImage';
import { useAuth } from '@/context/auth-context';
import { fetchItems, type ItemApiDto } from '@/services/itemService';
import { colors } from '@/theme/colors';
import { borderRadius, layout, spacing } from '@/theme/spacing';

function parseItemFromParams(itemData?: string | null): ItemApiDto | null {
  if (!itemData || typeof itemData !== 'string') return null;
  try {
    const parsed = JSON.parse(itemData) as ItemApiDto;
    return parsed && typeof parsed.itemId === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

export default function ItemDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const params = useLocalSearchParams<{
    itemId?: string;
    outletId?: string;
    itemData?: string;
  }>();

  const initialItem = parseItemFromParams(params.itemData);
  const [item, setItem] = useState<ItemApiDto | null>(initialItem);

  useEffect(() => {
    setItem(parseItemFromParams(params.itemData));
  }, [params.itemData]);

  useEffect(() => {
    if (!item?.itemId || !params.outletId || item.itemImage) return;
    let cancelled = false;
    fetchItems({ outletId: params.outletId, page: 0, size: 50 })
      .then((list) => {
        if (cancelled) return;
        const found = list.find((i) => i.itemId === item.itemId);
        if (found) setItem(found);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [item?.itemId, item?.itemImage, params.outletId]);

  if (!item) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <View style={styles.errorBlock}>
          <MaterialIcons name="error-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.errorText}>Item not found.</Text>
        </View>
      </View>
    );
  }

  const isActive = (item.status ?? '').toUpperCase() === 'ACTIVE' || item.availability;
  const hasDiscount = item.discountAvailability === true;

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
        {/* Hero image - GET /api/images/show?type=item&fileName=... */}
        <View style={styles.heroImageWrap}>
          {item.itemImage && token ? (
            <AuthImage
              type="item"
              fileName={item.itemImage}
              token={token}
              style={styles.heroImage}
              resizeMode="cover"
              placeholder={
                <View style={styles.heroPlaceholder}>
                  <MaterialIcons name="restaurant" size={64} color={colors.textSecondary} />
                </View>
              }
            />
          ) : (
            <View style={styles.heroPlaceholder}>
              <MaterialIcons name="restaurant" size={64} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.heroBadges}>
            <View style={[styles.badge, isActive ? styles.badgeSuccess : styles.badgeError]}>
              <Text style={[styles.badgeText, isActive ? styles.badgeTextSuccess : styles.badgeTextError]}>
                {isActive ? 'Available' : 'Unavailable'}
              </Text>
            </View>
            {hasDiscount && (
              <View style={[styles.badge, styles.badgeAccent]}>
                <Text style={styles.badgeTextAccent}>On discount</Text>
              </View>
            )}
          </View>
        </View>

        {/* Title & price */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{item.itemName}</Text>
          <Text style={styles.price}>LKR {Number(item.price).toLocaleString()}</Text>
        </View>

        {/* Description */}
        {item.itemDescription ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Description</Text>
            <Text style={styles.cardValue}>{item.itemDescription}</Text>
          </View>
        ) : null}

        {/* Category */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <MaterialIcons name="category" size={20} color={colors.primary} />
            <Text style={styles.cardLabel}>Category</Text>
          </View>
          <Text style={styles.cardValue}>{item.categoryName ?? 'Uncategorized'}</Text>
          {item.categoryTypeName ? (
            <Text style={styles.cardSub}>{item.categoryTypeName}</Text>
          ) : null}
        </View>

        {/* Status */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <MaterialIcons name="info-outline" size={20} color={colors.primary} />
            <Text style={styles.cardLabel}>Status</Text>
          </View>
          <Text style={styles.cardValue}>{item.status ?? (item.availability ? 'ACTIVE' : 'INACTIVE')}</Text>
          <Text style={styles.cardSub}>
            Availability: {item.availability ? 'Yes' : 'No'}
            {item.discountAvailability ? ' · Discount: Yes' : ''}
          </Text>
        </View>

        {/* Outlet */}
        {item.outletName ? (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <MaterialIcons name="store" size={20} color={colors.primary} />
              <Text style={styles.cardLabel}>Outlet</Text>
            </View>
            <Text style={styles.cardValue}>{item.outletName}</Text>
          </View>
        ) : null}

        {/* IDs (subtle) */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Item ID: {item.itemId}</Text>
          {item.outletId ? <Text style={styles.metaText}>Outlet ID: {item.outletId}</Text> : null}
        </View>

        {/* Edit CTA */}
        <Pressable
          style={styles.editBtn}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/outlets/items/edit',
              params: {
                id: String(item.itemId),
                outletId: params.outletId ?? String(item.outletId),
                itemData: JSON.stringify(item),
              },
            })
          }
        >
          <MaterialIcons name="edit" size={20} color={colors.white} />
          <Text style={styles.editBtnText}>Edit item</Text>
        </Pressable>

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
  heroBadges: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
  },
  badgeSuccess: { borderColor: colors.success },
  badgeError: { borderColor: colors.error },
  badgeAccent: { borderColor: colors.accent },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeTextSuccess: { color: colors.success },
  badgeTextError: { color: colors.error },
  badgeTextAccent: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  titleBlock: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  price: {
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
  cardSub: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  editBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
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

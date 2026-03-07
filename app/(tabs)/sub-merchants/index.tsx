import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { EmptyState, ScreenContainer } from '@/components/dashboard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useRole } from '@/hooks/useRole';
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

function SubMerchantCard({
  item,
  onPress,
}: {
  item: SubMerchantItem;
  onPress?: () => void;
}) {
  const initial =
    (item.merchantName || item.merchantEmail || 'M').trim().charAt(0).toUpperCase() || 'M';
  const statusStyle = getStatusStyle(item.subMerchantStatus);

  const content = (
    <>
      <View style={styles.cardAccent} />
      <View style={styles.cardInner}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.merchantName}
            </Text>
            {item.parentMerchantName ? (
              <Text style={styles.cardSub} numberOfLines={1}>
                {item.parentMerchantName}
              </Text>
            ) : null}
          </View>
          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>
              {item.subMerchantStatus}
            </Text>
          </View>
        </View>
        <View style={styles.cardMeta}>
          {item.merchantEmail ? (
            <View style={styles.metaRow}>
              <MaterialIcons name="email-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.merchantEmail}
              </Text>
            </View>
          ) : null}
          {item.merchantPhoneNumber ? (
            <View style={styles.metaRow}>
              <MaterialIcons name="phone-android" size={16} color={colors.textSecondary} />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.merchantPhoneNumber}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={styles.card}>{content}</View>;
}

export default function SubMerchantsScreen() {
  const router = useRouter();
  const role = useRole();
  const { subMerchants, refresh } = useDashboardData();

  useFocusEffect(
    useCallback(() => {
      if (role === 'MERCHANT') refresh();
    }, [role, refresh])
  );

  if (role !== 'MERCHANT') {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Sub Merchants</Text>
            <Text style={styles.headerSubtitle}>Main merchant only</Text>
          </View>
        </View>
        <EmptyState
          icon="people-outline"
          title="Not available"
          message="Only main merchants can manage sub merchants."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Sub Merchants</Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/sub-merchants/add')}
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
        >
          <Text style={styles.addButtonText}>Add Sub Merchant</Text>
        </Pressable>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {subMerchants.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No sub merchants yet"
            message="Add sub merchants to assign them to outlets."
          />
        ) : (
          subMerchants.map((sm, idx) => (
            <SubMerchantCard
              key={sm.subMerchantId ?? `sm-${idx}`}
              item={sm}
              onPress={() => router.push(`/(tabs)/sub-merchants/${sm.subMerchantId}`)}
            />
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const headerShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  android: { elevation: 3 },
  default: {},
});

const styles = StyleSheet.create({
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
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.white,
    opacity: 0.85,
    marginTop: spacing.xxs,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: cardRadius,
    marginBottom: spacing.md,
    overflow: 'hidden',
    flexDirection: 'row',
    minHeight: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.95,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.white,
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  cardSub: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
  },
  cardMeta: {
    gap: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    flex: 1,
  },
});

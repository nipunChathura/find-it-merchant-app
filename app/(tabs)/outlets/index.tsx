import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState, OutletCard, ScreenContainer } from '@/components/dashboard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/context/auth-context';
import { useRole } from '@/hooks/useRole';
import { fetchAssignedOutlets } from '@/services/outletService';
import { colors } from '@/theme/colors';
import { borderRadius, cardRadius, spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';
import type { Outlet } from '@/types';

/** Outlet list from GET /api/outlets/assigned (MERCHANT: ?merchantId=, SUBMERCHANT: ?subMerchantId=). Bearer token sent by apiClient. */
export default function OutletListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const role = useRole();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOutlets = useCallback(async () => {
    const isMerchant = role === 'MERCHANT';
    const merchantId = user?.merchantId;
    const subMerchantId = user?.subMerchantId;

    if (isMerchant && merchantId == null) {
      setOutlets([]);
      setLoading(false);
      return;
    }
    if (!isMerchant && subMerchantId == null) {
      setOutlets([]);
      setLoading(false);
      return;
    }

    const timeoutMs = 10000;
    const timeoutId = setTimeout(() => setLoading(false), timeoutMs);

    const applyState = (list: Outlet[]) => {
      clearTimeout(timeoutId);
      setOutlets(list);
      setLoading(false);
    };

    try {
      if (isMerchant && merchantId != null) {
        const list = await fetchAssignedOutlets({ merchantId });
        setTimeout(() => applyState(list ?? []), 0);
      } else if (!isMerchant && subMerchantId != null) {
        const list = await fetchAssignedOutlets({ subMerchantId });
        setTimeout(() => applyState(list ?? []), 0);
      } else {
        setTimeout(() => applyState([]), 0);
      }
    } catch (e) {
      console.warn('[Outlets] loadOutlets error:', e);
      setTimeout(() => applyState([]), 0);
    }
  }, [role, user?.merchantId, user?.subMerchantId]);

  const loadOutletsRef = useRef(loadOutlets);
  loadOutletsRef.current = loadOutlets;

  useEffect(() => {
    const id = setTimeout(() => loadOutletsRef.current(), 50);
    return () => clearTimeout(id);
  }, []);

  const title = role === 'SUBMERCHANT' ? 'My Outlets' : 'All Outlets';
  const isMerchant = role === 'MERCHANT';

  return (
    <ScreenContainer>
      <View style={styles.section}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          {isMerchant ? (
            <Pressable
              onPress={() => router.push('/(tabs)/outlets/add')}
              style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
            >
              <Text style={styles.addButtonText}>Add Outlet</Text>
            </Pressable>
          ) : null}
        </View>
        {loading && outlets.length === 0 ? (
          <View style={styles.loadingWrap}>
            <LoadingSpinner />
          </View>
        ) : outlets.length === 0 ? (
          <EmptyState
            icon="store"
            title="No outlet data"
            message={
              role === 'SUBMERCHANT'
                ? 'No outlets assigned to you yet. Data will appear here once assigned.'
                : 'No outlet data available. Add your first outlet to get started.'
            }
          />
        ) : (
          outlets.map((outlet, idx) => (
            <OutletCard
              key={`outlet-${idx}-${outlet?.id ?? 'noid'}`}
              outlet={outlet}
              onPress={() => router.push(`/(tabs)/outlets/${outlet.id}`)}
            />
          ))
        )}
      </View>
    </ScreenContainer>
  );
}

const headerShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
  default: {},
});

const styles = StyleSheet.create({
  section: {
    flex: 1,
    marginBottom: spacing.xxl,
  },
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
  addButtonPressed: {
    opacity: 0.9,
  },
  addButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  loadingWrap: {
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

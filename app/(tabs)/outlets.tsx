import React from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState, OutletCard, ScreenContainer, SectionHeader } from '@/components/dashboard';
import { useAuth } from '@/context/auth-context';
import { useRole } from '@/hooks/useRole';
import { fetchOutlets } from '@/services/outletService';
import { spacing } from '@/theme/spacing';
import type { Outlet } from '@/types';

export default function OutletsScreen() {
  const { token } = useAuth();
  const role = useRole();
  const [outlets, setOutlets] = React.useState<Outlet[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(() => {
    if (!token || !role) return;
    fetchOutlets(role, token).then(setOutlets);
  }, [token, role]);

  React.useEffect(() => {
    if (!token || !role) return;
    setLoading(true);
    fetchOutlets(role, token)
      .then(setOutlets)
      .finally(() => setLoading(false));
  }, [token, role]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    load();
    setTimeout(() => setRefreshing(false), 500);
  }, [load]);

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.section}>
        <SectionHeader
          title={role === 'SUBMERCHANT' ? 'My Outlets' : 'All Outlets'}
        />
        {!loading && outlets.length === 0 ? (
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
            <OutletCard key={outlet.id} outlet={outlet} onPress={() => {}} />
          ))
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xxl,
  },
});

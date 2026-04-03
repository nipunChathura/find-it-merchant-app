import React from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';

import { EmptyState, NotificationItem, ScreenContainer, SectionHeader } from '@/components/dashboard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function NotificationsScreen() {
  const {
    allNotifications: normalizedNotifications,
    loading,
    refreshing,
    refresh,
    markNotificationRead,
  } = useDashboardData();

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />
      }
    >
      <SectionHeader title="Notifications" />
      {loading && normalizedNotifications.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : normalizedNotifications.length === 0 ? (
        <EmptyState
          icon="notifications"
          title="No notifications"
          message="You're all caught up."
        />
      ) : (
        normalizedNotifications.map((n, idx) => (
          <NotificationItem
            key={n?.id ?? `notif-${idx}`}
            notification={n}
            onReadPress={(item) => {
              void markNotificationRead(item);
            }}
          />
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

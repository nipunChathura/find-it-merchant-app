import React from 'react';
import { StyleSheet } from 'react-native';

import { EmptyState, NotificationItem, ScreenContainer, SectionHeader } from '@/components/dashboard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { spacing } from '@/theme/spacing';

export default function NotificationsScreen() {
  const { allNotifications: notifications, loading } = useDashboardData();

  return (
    <ScreenContainer>
      <SectionHeader title="Notifications" />
      {loading ? null : notifications.length === 0 ? (
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xxl },
});

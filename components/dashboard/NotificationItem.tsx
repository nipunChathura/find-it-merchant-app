import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fontSizes, fontWeights } from '@/theme/typography';
import type { Notification } from '@/types';

interface NotificationItemProps {
  notification: Notification;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

export function NotificationItem({ notification }: NotificationItemProps) {
  return (
    <View
      style={[
        styles.row,
        !notification.read && styles.rowUnread,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          !notification.read && styles.iconWrapUnread,
        ]}
      >
        <MaterialIcons
          name="notifications"
          size={20}
          color={notification.read ? colors.textSecondary : colors.accent}
        />
      </View>
      <View style={styles.body}>
        <Text
          style={[styles.title, !notification.read && styles.titleUnread]}
          numberOfLines={1}
        >
          {notification.title}
        </Text>
        <Text style={styles.bodyText} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.time}>{formatTime(notification.timestamp)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  rowUnread: {
    backgroundColor: colors.accent + '12',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  iconWrapUnread: {
    backgroundColor: colors.accent + '24',
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  titleUnread: {
    color: colors.textPrimary,
  },
  bodyText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  time: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});

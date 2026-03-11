import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAuth } from '@/context/auth-context';
import { useRole } from '@/hooks/useRole';
import {
    fetchMerchantDashboard,
    fetchRecentNotifications,
} from '@/services/dashboardService';
import type {
    DashboardSummary,
    Notification,
    Outlet,
    PaymentItem,
    SubMerchantItem,
} from '@/types';

export function useDashboardData() {
  const { token, user } = useAuth();
  const role = useRole();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [subMerchants, setSubMerchants] = useState<SubMerchantItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!token || !role) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const [dashboardRes, notifRes] = await Promise.all([
          fetchMerchantDashboard(),
          fetchRecentNotifications(token, user?.userId),
        ]);
        if (dashboardRes) {
          setSummary(dashboardRes.summary);
          setOutlets(dashboardRes.outlets);
          setPayments(dashboardRes.payments);
          setSubMerchants(dashboardRes.subMerchants);
        } else {
          setSummary(null);
          setOutlets([]);
          setPayments([]);
          setSubMerchants([]);
        }
        setNotifications(notifRes);
      } catch {
        setSummary(null);
        setOutlets([]);
        setPayments([]);
        setSubMerchants([]);
        setNotifications([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, role, user?.userId]
  );

  const refresh = useCallback(() => load(true), [load]);

  useEffect(() => {
    load();
  }, [load]);

  // Refetch dashboard when app comes to foreground (e.g. user taps app icon)
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        load(true);
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [load]);

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  return {
    summary,
    outlets,
    allOutlets: outlets,
    payments,
    subMerchants,
    notifications: notifications.slice(0, 3),
    allNotifications: notifications,
    unreadNotificationCount,
    loading,
    refreshing,
    load,
    refresh,
    role,
  };
}

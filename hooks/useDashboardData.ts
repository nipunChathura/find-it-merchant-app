import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { useRole } from '@/hooks/useRole';
import {
    fetchDashboardSummary,
    fetchOutletsForRole,
    fetchRecentNotifications,
} from '@/services/dashboardService';
import type { DashboardSummary, Notification, Outlet } from '@/types';

export function useDashboardData() {
  const { token } = useAuth();
  const role = useRole();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!token || !role) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const [summaryRes, outletsRes, notifRes] = await Promise.all([
          fetchDashboardSummary(role, token),
          fetchOutletsForRole(role, token),
          fetchRecentNotifications(token),
        ]);
        setSummary(summaryRes);
        setOutlets(outletsRes);
        setNotifications(notifRes);
      } catch {
        setSummary(null);
        setOutlets([]);
        setNotifications([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, role]
  );

  const refresh = useCallback(() => load(true), [load]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    summary,
    outlets: outlets.slice(0, 5),
    allOutlets: outlets,
    notifications: notifications.slice(0, 3),
    loading,
    refreshing,
    load,
    refresh,
    role,
  };
}

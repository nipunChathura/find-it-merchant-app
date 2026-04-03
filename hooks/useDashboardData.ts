import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAuth } from '@/context/auth-context';
import { useRole } from '@/hooks/useRole';
import {
  fetchMerchantDashboard,
  fetchRecentNotifications,
  markNotificationRead as markNotificationReadApi,
} from '@/services/dashboardService';
import type {
  DashboardSummary,
  Notification,
  Outlet,
  PaymentItem,
  SubMerchantItem,
  UserRole,
} from '@/types';

export type DashboardDataValue = {
  summary: DashboardSummary | null;
  outlets: Outlet[];
  allOutlets: Outlet[];
  payments: PaymentItem[];
  subMerchants: SubMerchantItem[];
  notifications: Notification[];
  allNotifications: Notification[];
  unreadNotificationCount: number;
  loading: boolean;
  refreshing: boolean;
  load: (isRefresh?: boolean) => Promise<void>;
  refresh: () => Promise<void>;
  /** POST …/read/:messageId; updates the row matched by notification.id */
  markNotificationRead: (notification: Notification) => Promise<void>;
  role: UserRole | null;
};

const DashboardDataContext = createContext<DashboardDataValue | null>(null);

function useDashboardDataState(): DashboardDataValue {
  const { token, user } = useAuth();
  const role = useRole();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [subMerchants, setSubMerchants] = useState<SubMerchantItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const notificationsRef = useRef<Notification[]>([]);
  const markingReadIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

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

  const markNotificationRead = useCallback(
    async (notification: Notification) => {
      const listId = String(notification.id).trim();
      const apiId = String(notification.readId ?? notification.id).trim();
      if (!listId || !apiId) return;
      if (/^notif-\d+$/.test(listId)) return;
      const current = notificationsRef.current.find((n) => n.id === listId);
      if (!current || current.read) return;
      if (markingReadIdsRef.current.has(listId)) return;
      markingReadIdsRef.current.add(listId);
      try {
        const ok = await markNotificationReadApi(apiId);
        if (!ok || !token) return;
        setNotifications((prev) => prev.filter((n) => n.id !== listId));
        try {
          const notifRes = await fetchRecentNotifications(token, user?.userId);
          setNotifications(notifRes);
        } catch {
          /* read item already removed; inbox stays unread-only */
        }
      } finally {
        markingReadIdsRef.current.delete(listId);
      }
    },
    [token, user?.userId]
  );

  return useMemo(() => {
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
      markNotificationRead,
      role,
    };
  }, [
    summary,
    outlets,
    payments,
    subMerchants,
    notifications,
    loading,
    refreshing,
    load,
    refresh,
    markNotificationRead,
    role,
  ]);
}

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const value = useDashboardDataState();
  return createElement(DashboardDataContext.Provider, { value }, children);
}

export function useDashboardData(): DashboardDataValue {
  const ctx = useContext(DashboardDataContext);
  if (ctx == null) {
    throw new Error('useDashboardData must be used within DashboardDataProvider');
  }
  return ctx;
}

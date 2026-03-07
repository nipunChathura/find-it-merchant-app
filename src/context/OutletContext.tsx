/**
 * OutletContext - outlets, items, schedules, payments.
 * Persists to AsyncStorage. Role-based filtering for outlets (SubMerchant sees only assigned).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = '@findit_outlet_data';

export interface OutletRecord {
  id: string;
  name: string;
  location: string;
  contactNumber: string;
  description: string;
  status: 'OPEN' | 'CLOSED';
  assignedToSubMerchantId: string | null;
}

export interface ItemRecord {
  id: string;
  outletId: string;
  name: string;
  price: number;
  category: string;
  description: string;
  availability: boolean;
}

export interface ScheduleRecord {
  id: string;
  outletId: string;
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
}

export interface PaymentRecord {
  id: string;
  outletId: string;
  outletName: string;
  month: string;
  paymentAmount: number;
  receiptImageUri: string | null;
  createdAt: string;
}

interface OutletData {
  outlets: OutletRecord[];
  items: ItemRecord[];
  schedules: ScheduleRecord[];
  payments: PaymentRecord[];
}

const defaultData: OutletData = {
  outlets: [],
  items: [],
  schedules: [],
  payments: [],
};

type UserRole = 'MERCHANT' | 'SUBMERCHANT';

interface OutletContextValue extends OutletData {
  load: () => Promise<void>;
  // Outlets
  addOutlet: (o: Omit<OutletRecord, 'id'>) => Promise<OutletRecord>;
  updateOutlet: (id: string, o: Partial<OutletRecord>) => Promise<void>;
  deleteOutlet: (id: string) => Promise<void>;
  assignOutletToSubMerchant: (outletId: string, subMerchantUserId: string | null) => Promise<void>;
  getOutletsForRole: (role: UserRole, currentUserId: string | null) => OutletRecord[];
  getOutletById: (id: string) => OutletRecord | undefined;
  // Items
  getItemsByOutletId: (outletId: string) => ItemRecord[];
  addItem: (item: Omit<ItemRecord, 'id'>) => Promise<ItemRecord>;
  updateItem: (id: string, item: Partial<ItemRecord>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  // Schedules
  getSchedulesByOutletId: (outletId: string) => ScheduleRecord[];
  addSchedule: (s: Omit<ScheduleRecord, 'id'>) => Promise<ScheduleRecord>;
  updateSchedule: (id: string, s: Partial<ScheduleRecord>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  // Payments
  getPaymentsByOutletId: (outletId: string) => PaymentRecord[];
  addPayment: (p: Omit<PaymentRecord, 'id' | 'createdAt'>) => Promise<PaymentRecord>;
  // Derived for dashboard/cards
  totalItemsCount: number;
  pendingPaymentsCount: number;
}

const OutletContext = createContext<OutletContextValue | null>(null);

export function OutletProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OutletData>(defaultData);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as OutletData;
        setData({
          outlets: parsed.outlets ?? [],
          items: parsed.items ?? [],
          schedules: parsed.schedules ?? [],
          payments: parsed.payments ?? [],
        });
      }
    } catch {
      setData(defaultData);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const persist = useCallback((next: OutletData) => {
    setData(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const addOutlet = useCallback(
    async (o: Omit<OutletRecord, 'id'>): Promise<OutletRecord> => {
      const record: OutletRecord = {
        ...o,
        id: `outlet_${Date.now()}`,
        assignedToSubMerchantId: o.assignedToSubMerchantId ?? null,
      };
      setData((prev) => {
        const next = { ...prev, outlets: [...prev.outlets, record] };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
      return record;
    },
    []
  );

  const updateOutlet = useCallback(async (id: string, patch: Partial<OutletRecord>) => {
    setData((prev) => {
      const outlets = prev.outlets.map((o) => (o.id === id ? { ...o, ...patch } : o));
      const next = { ...prev, outlets };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const deleteOutlet = useCallback(async (id: string) => {
    setData((prev) => {
      const next = {
        outlets: prev.outlets.filter((o) => o.id !== id),
        items: prev.items.filter((i) => i.outletId !== id),
        schedules: prev.schedules.filter((s) => s.outletId !== id),
        payments: prev.payments.filter((p) => p.outletId !== id),
      };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const assignOutletToSubMerchant = useCallback(async (outletId: string, subMerchantUserId: string | null) => {
    setData((prev) => {
      const outlets = prev.outlets.map((o) =>
        o.id === outletId ? { ...o, assignedToSubMerchantId: subMerchantUserId } : o
      );
      const next = { ...prev, outlets };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const getOutletsForRole = useCallback(
    (role: UserRole, currentUserId: string | null): OutletRecord[] => {
      if (role === 'SUBMERCHANT' && currentUserId) {
        return data.outlets.filter((o) => o.assignedToSubMerchantId === currentUserId);
      }
      return data.outlets;
    },
    [data.outlets]
  );

  const getOutletById = useCallback(
    (id: string) => data.outlets.find((o) => o.id === id),
    [data.outlets]
  );

  const getItemsByOutletId = useCallback(
    (outletId: string) => data.items.filter((i) => i.outletId === outletId),
    [data.items]
  );

  const addItem = useCallback(async (item: Omit<ItemRecord, 'id'>): Promise<ItemRecord> => {
    const record: ItemRecord = { ...item, id: `item_${Date.now()}` };
    setData((prev) => {
      const next = { ...prev, items: [...prev.items, record] };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
    return record;
  }, []);

  const updateItem = useCallback(async (id: string, patch: Partial<ItemRecord>) => {
    setData((prev) => {
      const items = prev.items.map((i) => (i.id === id ? { ...i, ...patch } : i));
      const next = { ...prev, items };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    setData((prev) => {
      const next = { ...prev, items: prev.items.filter((i) => i.id !== id) };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const getSchedulesByOutletId = useCallback(
    (outletId: string) => data.schedules.filter((s) => s.outletId === outletId),
    [data.schedules]
  );

  const addSchedule = useCallback(async (s: Omit<ScheduleRecord, 'id'>): Promise<ScheduleRecord> => {
    const record: ScheduleRecord = { ...s, id: `sched_${Date.now()}` };
    setData((prev) => {
      const next = { ...prev, schedules: [...prev.schedules, record] };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
    return record;
  }, []);

  const updateSchedule = useCallback(async (id: string, patch: Partial<ScheduleRecord>) => {
    setData((prev) => {
      const schedules = prev.schedules.map((s) => (s.id === id ? { ...s, ...patch } : s));
      const next = { ...prev, schedules };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const deleteSchedule = useCallback(async (id: string) => {
    setData((prev) => {
      const next = { ...prev, schedules: prev.schedules.filter((s) => s.id !== id) };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const getPaymentsByOutletId = useCallback(
    (outletId: string) =>
      data.payments.filter((p) => p.outletId === outletId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data.payments]
  );

  const addPayment = useCallback(
    async (p: Omit<PaymentRecord, 'id' | 'createdAt'>): Promise<PaymentRecord> => {
      const record: PaymentRecord = {
        ...p,
        id: `pay_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setData((prev) => {
        const next = { ...prev, payments: [...prev.payments, record] };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
      return record;
    },
    []
  );

  const totalItemsCount = data.items.length;
  const thisMonth = new Date().toISOString().slice(0, 7);
  const paidOutletIds = new Set(
    data.payments.filter((p) => p.month === thisMonth).map((p) => p.outletId)
  );
  const pendingPaymentsCount = data.outlets.filter((o) => !paidOutletIds.has(o.id)).length;

  const value: OutletContextValue = {
    ...data,
    load,
    addOutlet,
    updateOutlet,
    deleteOutlet,
    assignOutletToSubMerchant,
    getOutletsForRole,
    getOutletById,
    getItemsByOutletId,
    addItem,
    updateItem,
    deleteItem,
    getSchedulesByOutletId,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    getPaymentsByOutletId,
    addPayment,
    totalItemsCount,
    pendingPaymentsCount,
  };

  return <OutletContext.Provider value={value}>{children}</OutletContext.Provider>;
}

export function useOutletContext() {
  const ctx = useContext(OutletContext);
  if (!ctx) throw new Error('useOutletContext must be used within OutletProvider');
  return ctx;
}

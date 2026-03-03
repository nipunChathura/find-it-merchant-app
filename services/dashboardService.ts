import type { DashboardSummary, Notification, Outlet, UserRole } from '@/types';

const MOCK_DELAY = 600;

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Role-based: Merchant sees all outlets (owned + sub-merchant assigned).
 * Sub-Merchant sees only assigned outlets.
 */
export async function fetchDashboardSummary(
  _role: UserRole,
  _token: string
): Promise<DashboardSummary> {
  await delay(MOCK_DELAY);
  return {
    totalOutlets: 12,
    activeOutlets: 9,
    totalItems: 248,
    pendingPayments: 3,
  };
}

export async function fetchOutletsForRole(
  role: UserRole,
  _token: string
): Promise<Outlet[]> {
  await delay(MOCK_DELAY);
  const all: Outlet[] = [
    { id: '1', name: 'Downtown Branch', status: 'OPEN', totalItems: 45, paymentStatus: 'PAID' },
    { id: '2', name: 'Mall Outlet', status: 'OPEN', totalItems: 62, paymentStatus: 'PENDING' },
    { id: '3', name: 'Airport Kiosk', status: 'CLOSED', totalItems: 28, paymentStatus: 'PAID' },
    { id: '4', name: 'Central Store', status: 'OPEN', totalItems: 89, paymentStatus: 'PAID', assignedToSubMerchant: true },
    { id: '5', name: 'West Side', status: 'CLOSED', totalItems: 24, paymentStatus: 'OVERDUE' },
  ];
  if (role === 'SUBMERCHANT') {
    return all.filter((o) => o.assignedToSubMerchant);
  }
  return all;
}

export async function fetchRecentNotifications(
  _token: string
): Promise<Notification[]> {
  await delay(MOCK_DELAY);
  return [
    { id: '1', title: 'Payment received', body: 'Payment of $1,200 received.', timestamp: new Date().toISOString(), read: false },
    { id: '2', title: 'Outlet update', body: 'Downtown Branch schedule updated.', timestamp: new Date(Date.now() - 3600000).toISOString(), read: true },
    { id: '3', title: 'New order', body: 'Bulk order #8842 placed.', timestamp: new Date(Date.now() - 7200000).toISOString(), read: false },
  ];
}

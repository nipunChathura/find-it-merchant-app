import type { Outlet, UserRole } from '@/types';

const MOCK_DELAY = 400;

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchOutlets(
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

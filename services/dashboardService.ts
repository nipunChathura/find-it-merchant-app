import { API_ENDPOINTS } from '@/constants/api';
import type {
    DashboardSummary,
    Notification,
    Outlet,
    PaymentItem,
    PaymentStatus,
    PendingPaymentDetail,
    SubMerchantItem,
    UserRole,
} from '@/types';
import { apiClient } from '@/utils/apiClient';

const MOCK_DELAY = 600;

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Dashboard API outlet (from response.outlets[]) */
export interface DashboardOutletApi {
  outletId: number;
  outletName: string;
  status: string;
  merchantId: number;
  merchantName: string;
  subMerchantId?: number;
  subMerchantName?: string;
  addressLine1?: string;
  cityName?: string;
  districtName?: string;
  provinceName?: string;
  postalCode?: string;
  contactNumber?: string;
  emailAddress?: string;
  latitude?: number;
  longitude?: number;
  [key: string]: unknown;
}

/** Dashboard API payment (from response.payments[] / response.pendingPayments[]) */
export interface DashboardPaymentApi {
  paymentId: number;
  outletId: number;
  outletName: string;
  amount: number;
  paidMonth: string;
  paymentDate: string;
  paymentStatus: string;
  paymentType: string;
  receiptImage?: string;
}

/** Dashboard API sub-merchant (from response.subMerchants[]) */
export interface DashboardSubMerchantApi {
  subMerchantId: number;
  merchantId: number;
  merchantName: string;
  parentMerchantName: string;
  merchantEmail: string;
  merchantPhoneNumber: string;
  merchantAddress: string;
  merchantNic: string;
  merchantType: string;
  subMerchantStatus: string;
  [key: string]: unknown;
}

export interface DashboardApiResponse {
  status: string;
  responseCode: string;
  responseMessage: string;
  totalOutletCount: number;
  activeOutletCount: number;
  totalItems: number;
  pendingPaymentCount: number;
  outlets?: DashboardOutletApi[];
  payments?: DashboardPaymentApi[];
  pendingPayments?: DashboardPaymentApi[];
  subMerchants?: DashboardSubMerchantApi[];
}

export interface FullDashboardResult {
  summary: DashboardSummary;
  outlets: Outlet[];
  pendingPaymentDetails: PendingPaymentDetail[];
  payments: PaymentItem[];
  subMerchants: SubMerchantItem[];
}

function mapApiOutletToOutlet(
  d: DashboardOutletApi,
  pendingOutletIds: Set<number>
): Outlet {
  const status = d.status === 'ACTIVE' ? 'OPEN' : 'CLOSED';
  const paymentStatus: PaymentStatus = pendingOutletIds.has(d.outletId)
    ? 'PENDING'
    : 'PAID';
  const location = [d.addressLine1, d.cityName, d.districtName, d.provinceName]
    .filter(Boolean)
    .join(', ');
  return {
    id: String(d.outletId),
    name: d.outletName ?? '',
    status,
    totalItems: 0,
    paymentStatus,
    assignedToSubMerchant: d.subMerchantId != null,
    assignedToSubMerchantId: d.subMerchantId != null ? String(d.subMerchantId) : null,
    location: location || undefined,
    contactNumber: d.contactNumber,
    latitude: d.latitude,
    longitude: d.longitude,
  };
}

function mapApiPaymentToItem(p: DashboardPaymentApi): PendingPaymentDetail & PaymentItem {
  return {
    paymentId: p.paymentId,
    outletId: p.outletId,
    outletName: p.outletName,
    amount: p.amount,
    paidMonth: p.paidMonth,
    paymentDate: p.paymentDate,
    paymentStatus: p.paymentStatus,
    paymentType: p.paymentType,
    receiptImage: p.receiptImage,
  };
}

function mapApiSubMerchantToItem(d: DashboardSubMerchantApi): SubMerchantItem {
  return {
    subMerchantId: d.subMerchantId,
    merchantId: d.merchantId,
    merchantName: d.merchantName,
    parentMerchantName: d.parentMerchantName,
    merchantEmail: d.merchantEmail,
    merchantPhoneNumber: d.merchantPhoneNumber,
    merchantAddress: d.merchantAddress,
    merchantNic: d.merchantNic,
    merchantType: d.merchantType,
    subMerchantStatus: d.subMerchantStatus,
  };
}

/**
 * Fetch full dashboard from API (Bearer token sent by apiClient).
 * Maps response to summary, outlets, pendingPaymentDetails, payments, subMerchants.
 */
export async function fetchMerchantDashboard(): Promise<FullDashboardResult | null> {
  try {
    const { data } = await apiClient.get<DashboardApiResponse>(API_ENDPOINTS.merchantDashboard);
    if (data.status !== 'success') return null;

    const pendingOutletIds = new Set(
      (data.pendingPayments ?? []).map((p) => p.outletId)
    );

    const summary: DashboardSummary = {
      totalOutlets: data.totalOutletCount,
      activeOutlets: data.activeOutletCount,
      totalItems: data.totalItems,
      pendingPayments: data.pendingPaymentCount,
      pendingPaymentDetails: (data.pendingPayments ?? []).map(mapApiPaymentToItem),
    };

    const outlets: Outlet[] = (data.outlets ?? []).map((o) =>
      mapApiOutletToOutlet(o, pendingOutletIds)
    );

    const payments: PaymentItem[] = (data.payments ?? []).map(mapApiPaymentToItem);
    const subMerchants: SubMerchantItem[] = (data.subMerchants ?? []).map(
      mapApiSubMerchantToItem
    );

    return {
      summary,
      outlets,
      pendingPaymentDetails: summary.pendingPaymentDetails ?? [],
      payments,
      subMerchants,
    };
  } catch {
    return null;
  }
}

/**
 * Role-based: Merchant sees all outlets (owned + sub-merchant assigned).
 * Sub-Merchant sees only assigned outlets.
 * Fallback mock when API not used for outlets.
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

/** API notification item (field names may vary by backend) */
export interface NotificationDto {
  id?: number | string;
  title?: string;
  body?: string;
  message?: string;
  timestamp?: string;
  createdAt?: string;
  read?: boolean;
  [key: string]: unknown;
}

function mapNotificationDto(d: NotificationDto, index: number): Notification {
  const id = d.id != null ? String(d.id) : `notif-${index}`;
  const title = d.title ?? d.message ?? 'Notification';
  const body = d.body ?? d.message ?? '';
  const timestamp = d.timestamp ?? d.createdAt ?? new Date().toISOString();
  const read = d.read ?? false;
  return { id, title, body, timestamp, read };
}

/**
 * Fetch unread notifications from API: GET /api/notifications/unread/:userId
 * Uses Bearer token from apiClient. Pass login user id (user.userId).
 */
export async function fetchUnreadNotifications(userId: string): Promise<Notification[]> {
  if (!userId.trim()) return [];
  try {
    const url = API_ENDPOINTS.notificationsUnread(userId);
    const { data } = await apiClient.get<NotificationDto[] | { data?: NotificationDto[] }>(url);
    const list = Array.isArray(data) ? data : (data as { data?: NotificationDto[] })?.data ?? [];
    return (list as NotificationDto[]).map(mapNotificationDto);
  } catch {
    return [];
  }
}

/**
 * Fetch notifications for dashboard. Uses unread API with logged-in user id when available.
 */
export async function fetchRecentNotifications(
  _token: string,
  userId?: string
): Promise<Notification[]> {
  if (userId) {
    return fetchUnreadNotifications(userId);
  }
  await delay(MOCK_DELAY);
  return [
    { id: '1', title: 'Payment received', body: 'Payment of $1,200 received.', timestamp: new Date().toISOString(), read: false },
    { id: '2', title: 'Outlet update', body: 'Downtown Branch schedule updated.', timestamp: new Date(Date.now() - 3600000).toISOString(), read: true },
    { id: '3', title: 'New order', body: 'Bulk order #8842 placed.', timestamp: new Date(Date.now() - 7200000).toISOString(), read: false },
  ];
}

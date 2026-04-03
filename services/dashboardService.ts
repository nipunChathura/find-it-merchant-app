import { API_ENDPOINTS } from '@/constants/api';
import type { DashboardSummary, Notification, Outlet, PaymentItem, PaymentStatus, PendingPaymentDetail, SubMerchantItem, UserRole, } from '@/types';
import { apiClient } from '@/utils/apiClient';
const MOCK_DELAY = 600;
async function delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}
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
function mapApiOutletToOutlet(d: DashboardOutletApi, pendingOutletIds: Set<number>): Outlet {
    const raw = d.status != null ? String(d.status).trim() : '';
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
        statusRaw: raw || undefined,
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
export async function fetchMerchantDashboard(): Promise<FullDashboardResult | null> {
    try {
        const { data } = await apiClient.get<DashboardApiResponse>(API_ENDPOINTS.merchantDashboard);
        if (data.status !== 'success')
            return null;
        const pendingOutletIds = new Set((data.pendingPayments ?? []).map((p) => p.outletId));
        const summary: DashboardSummary = {
            totalOutlets: data.totalOutletCount,
            activeOutlets: data.activeOutletCount,
            totalItems: data.totalItems,
            pendingPayments: data.pendingPaymentCount,
            pendingPaymentDetails: (data.pendingPayments ?? []).map(mapApiPaymentToItem),
        };
        const outlets: Outlet[] = (data.outlets ?? []).map((o) => mapApiOutletToOutlet(o, pendingOutletIds));
        const payments: PaymentItem[] = (data.payments ?? []).map(mapApiPaymentToItem);
        const subMerchants: SubMerchantItem[] = (data.subMerchants ?? []).map(mapApiSubMerchantToItem);
        return {
            summary,
            outlets,
            pendingPaymentDetails: summary.pendingPaymentDetails ?? [],
            payments,
            subMerchants,
        };
    }
    catch {
        return null;
    }
}
export async function fetchDashboardSummary(_role: UserRole, _token: string): Promise<DashboardSummary> {
    await delay(MOCK_DELAY);
    return {
        totalOutlets: 12,
        activeOutlets: 9,
        totalItems: 248,
        pendingPayments: 3,
    };
}
export async function fetchOutletsForRole(role: UserRole, _token: string): Promise<Outlet[]> {
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
    const o = d as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
    const numStr = (v: unknown) => v != null && v !== '' && (typeof v === 'number' || typeof v === 'string') ? String(v).trim() : '';
    const messageIdStr = numStr(o.messageId);
    const notificationIdStr = numStr(o.notificationId);
    const idStr = d.id != null ? String(d.id).trim() : '';
    const id = idStr || messageIdStr || notificationIdStr || `notif-${index}`;
    const readId = messageIdStr && idStr && messageIdStr !== idStr ? messageIdStr : undefined;
    const rawTitle = str(d.title) ||
        str(o.subject) ||
        str(o.notificationTitle) ||
        str(d.message);
    const rawBody = str(d.body) ||
        str(o.description) ||
        str(o.notificationBody) ||
        str(o.notificationMessage);
    const messageOnly = str(d.message);
    const title = rawTitle || messageOnly || 'Notification';
    const body = rawBody ||
        (rawTitle && messageOnly && messageOnly !== rawTitle ? messageOnly : '') ||
        (!rawTitle && messageOnly ? '' : '');
    const timestamp = str(d.timestamp) ||
        str(d.createdAt) ||
        str(o.created_at) ||
        str(o.sentAt) ||
        new Date().toISOString();
    const read = Boolean(d.read ?? o.isRead);
    const out: Notification = { id, title, body, timestamp, read };
    if (readId)
        out.readId = readId;
    return out;
}
function extractNotificationList(raw: unknown): NotificationDto[] {
    if (raw == null)
        return [];
    if (Array.isArray(raw))
        return raw as NotificationDto[];
    if (typeof raw !== 'object')
        return [];
    const root = raw as Record<string, unknown>;
    const tryArray = (v: unknown): NotificationDto[] | null => Array.isArray(v) ? (v as NotificationDto[]) : null;
    const direct = tryArray(root.data) ??
        tryArray(root.notifications) ??
        tryArray(root.content) ??
        tryArray(root.results) ??
        tryArray(root.items);
    if (direct)
        return direct;
    const nested = root.data;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
        const inner = nested as Record<string, unknown>;
        return (tryArray(inner.notifications) ??
            tryArray(inner.content) ??
            tryArray(inner.data) ??
            []);
    }
    return [];
}
const CLIENT_NOTIFICATION_ID_PLACEHOLDER = /^notif-\d+$/;
export async function markNotificationRead(notificationId: string): Promise<boolean> {
    const id = String(notificationId).trim();
    if (!id || CLIENT_NOTIFICATION_ID_PLACEHOLDER.test(id))
        return false;
    try {
        const url = API_ENDPOINTS.notificationMarkRead(id);
        await apiClient.post(url);
        return true;
    }
    catch {
        return false;
    }
}
export function filterUnreadInbox(list: Notification[]): Notification[] {
    return list.filter((n) => !n.read);
}
export async function fetchUnreadNotifications(userId: string): Promise<Notification[]> {
    if (!userId.trim())
        return [];
    try {
        const url = API_ENDPOINTS.notificationsUnread(userId);
        const { data } = await apiClient.get<unknown>(url);
        const list = extractNotificationList(data);
        return filterUnreadInbox(list.map(mapNotificationDto));
    }
    catch {
        return [];
    }
}
export async function fetchRecentNotifications(_token: string, userId?: string): Promise<Notification[]> {
    if (userId) {
        return fetchUnreadNotifications(userId);
    }
    await delay(MOCK_DELAY);
    return filterUnreadInbox([
        { id: '1', title: 'Payment received', body: 'Payment of $1,200 received.', timestamp: new Date().toISOString(), read: false },
        { id: '2', title: 'Outlet update', body: 'Downtown Branch schedule updated.', timestamp: new Date(Date.now() - 3600000).toISOString(), read: true },
        { id: '3', title: 'New order', body: 'Bulk order #8842 placed.', timestamp: new Date(Date.now() - 7200000).toISOString(), read: false },
    ]);
}

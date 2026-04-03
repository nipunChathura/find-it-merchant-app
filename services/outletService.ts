import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';
import type { Outlet, UserRole } from '@/types';
import { apiClient } from '@/utils/apiClient';
export interface OutletDto {
    id: string;
    name: string;
    status: string;
    totalItems: number;
    paymentStatus: string;
    address?: string;
    phone?: string;
    assignedToSubMerchant?: boolean;
    latitude?: number;
    longitude?: number;
}
export interface AssignedOutletDto {
    outletId: number;
    outletName: string;
    currentStatus: string;
    itemCount?: number;
    contactNumber?: string;
    addressLine1?: string;
    cityName?: string;
    districtName?: string;
    provinceName?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    subMerchantId?: number;
    subMerchantName?: string;
    subMerchantInfo?: {
        merchantAddress?: string;
        merchantEmail?: string;
        merchantName?: string;
        merchantPhoneNumber?: string;
        subMerchantId?: number;
        [key: string]: unknown;
    };
    rating?: number;
    status?: string;
    [key: string]: unknown;
}
function toOutlet(d: OutletDto): Outlet {
    return {
        id: d.id,
        name: d.name,
        status: d.status as Outlet['status'],
        totalItems: d.totalItems,
        paymentStatus: d.paymentStatus as Outlet['paymentStatus'],
        assignedToSubMerchant: d.assignedToSubMerchant,
    };
}
function formatLocation(d: AssignedOutletDto): string {
    const parts = [d.addressLine1, d.cityName, d.districtName, d.provinceName].filter(Boolean);
    return parts.length ? parts.join(', ') : '';
}
function mapOutletStatus(raw: string | undefined): Outlet['status'] {
    const s = (raw ?? '').toUpperCase().trim();
    const known: Outlet['status'][] = [
        'OPEN',
        'CLOSED',
        'PENDING',
        'ACTIVE',
        'INACTIVE',
        'REJECTED',
        'DELETED',
    ];
    if (known.includes(s as Outlet['status']))
        return s as Outlet['status'];
    if (!s)
        return 'CLOSED';
    return 'UNKNOWN';
}
function mapCurrentStatus(raw: string | undefined): Outlet['currentStatus'] | undefined {
    const s = (raw ?? '').toUpperCase();
    if (s === 'OPEN' || s === 'CLOSED')
        return s as Outlet['currentStatus'];
    return undefined;
}
function assignedToOutlet(d: AssignedOutletDto): Outlet {
    const raw = typeof d.status === 'string' && d.status.trim() ? d.status.trim() : undefined;
    const status = mapOutletStatus(d.status);
    const currentStatus = mapCurrentStatus(d.currentStatus);
    const statusName = typeof (d as {
        statusName?: string;
    }).statusName === 'string'
        ? (d as {
            statusName?: string;
        }).statusName?.trim()
        : undefined;
    return {
        id: String(d.outletId),
        name: d.outletName ?? '',
        status,
        statusRaw: raw,
        statusName: statusName || undefined,
        currentStatus,
        totalItems: d.itemCount ?? 0,
        paymentStatus: 'PENDING',
        assignedToSubMerchant: d.subMerchantId != null,
        assignedToSubMerchantId: d.subMerchantId != null ? String(d.subMerchantId) : null,
        location: formatLocation(d),
        contactNumber: d.contactNumber ?? d.subMerchantInfo?.merchantPhoneNumber,
        latitude: d.latitude,
        longitude: d.longitude,
        subMerchantName: d.subMerchantName,
        subMerchantInfo: d.subMerchantInfo
            ? {
                merchantName: d.subMerchantInfo.merchantName,
                merchantEmail: d.subMerchantInfo.merchantEmail,
                merchantPhoneNumber: d.subMerchantInfo.merchantPhoneNumber,
                merchantAddress: d.subMerchantInfo.merchantAddress,
            }
            : undefined,
    };
}
export type AssignedOutletsParams = {
    merchantId: number;
    subMerchantId?: never;
} | {
    merchantId?: never;
    subMerchantId: number;
};
export async function fetchAssignedOutlets(params: AssignedOutletsParams): Promise<Outlet[]> {
    const requestParams = params.merchantId != null
        ? { merchantId: params.merchantId }
        : { subMerchantId: params.subMerchantId };
    const query = new URLSearchParams(Object.fromEntries(Object.entries(requestParams).map(([k, v]) => [k, String(v)]))).toString();
    const fullUrl = `${API_BASE_URL}${API_ENDPOINTS.outletsAssigned}?${query}`;
    console.log('[Outlets API] Calling assigned outlets:', fullUrl, 'params:', requestParams);
    try {
        const { data } = await apiClient.get<AssignedOutletDto[]>(API_ENDPOINTS.outletsAssigned, {
            params: requestParams,
        });
        const list = (data || []).map(assignedToOutlet);
        console.log('[Outlets API] Success:', list.length, 'outlets');
        return list;
    }
    catch (err) {
        console.warn('[Outlets API] Failed:', err instanceof Error ? err.message : err);
        if (err && typeof err === 'object' && 'response' in err) {
            const res = (err as {
                response?: {
                    status?: number;
                    data?: unknown;
                };
            }).response;
            if (res)
                console.warn('[Outlets API] Response:', res.status, res.data);
        }
        return [];
    }
}
function outletDtoToOutlet(d: OutletDto): Outlet {
    const raw = typeof d.status === 'string' && d.status.trim() ? d.status.trim() : undefined;
    return {
        id: String(d.id),
        name: d.name ?? '',
        status: mapOutletStatus(d.status),
        statusRaw: raw,
        totalItems: d.totalItems ?? 0,
        paymentStatus: (d.paymentStatus === 'PAID' ? 'PAID' : 'PENDING') as Outlet['paymentStatus'],
        location: d.address,
        contactNumber: d.phone,
        latitude: d.latitude,
        longitude: d.longitude,
    };
}
export async function fetchOutletById(id: string): Promise<Outlet | null> {
    try {
        const { data } = await apiClient.get<OutletDto>(`/api/outlets/${id}`);
        return data ? outletDtoToOutlet(data) : null;
    }
    catch {
        return null;
    }
}
export interface OutletDetailsMerchantDto {
    merchantAddress?: string;
    merchantEmail?: string;
    merchantId?: number;
    merchantName?: string;
    merchantNic?: string;
    merchantPhoneNumber?: string;
    merchantStatus?: string;
    merchantType?: string;
}
export interface OutletDetailsOutletDto {
    outletId: number;
    outletName?: string;
    status?: string;
    addressLine1?: string;
    cityName?: string;
    districtName?: string;
    provinceName?: string;
    postalCode?: string;
    contactNumber?: string;
    emailAddress?: string;
    latitude?: number;
    longitude?: number;
    outletType?: string;
    businessCategory?: string;
    businessRegistrationNumber?: string;
    taxIdentificationNumber?: string;
    bankName?: string;
    bankBranch?: string;
    accountNumber?: string;
    accountHolderName?: string;
    rating?: number;
    subscriptionValidUntil?: string;
    subscriptionStatus?: string;
    subMerchantId?: number;
    subMerchantName?: string;
    merchantName?: string;
    merchantId?: number;
    cityId?: number;
    districtId?: number;
    provinceId?: number;
    [key: string]: unknown;
}
export interface OutletDetailsSubMerchantDto {
    subMerchantId?: number;
    merchantName?: string;
    merchantEmail?: string;
    merchantPhoneNumber?: string;
    merchantAddress?: string;
    merchantNic?: string;
    merchantType?: string;
    parentMerchantName?: string;
    subMerchantStatus?: string;
    merchantId?: number;
    [key: string]: unknown;
}
export interface OutletDetailsResponse {
    assignedSubMerchant?: boolean;
    merchantDetails?: OutletDetailsMerchantDto;
    outlet?: OutletDetailsOutletDto;
    subMerchantDetails?: OutletDetailsSubMerchantDto;
    responseCode?: string;
    responseMessage?: string;
    status?: string;
}
function formatOutletLocation(o: OutletDetailsOutletDto): string {
    const parts = [o.addressLine1, o.cityName, o.districtName, o.provinceName].filter(Boolean);
    return parts.length ? parts.join(', ') : '';
}
export function detailsOutletToOutlet(o: OutletDetailsOutletDto): Outlet {
    const raw = typeof o.status === 'string' && o.status.trim() ? o.status.trim() : undefined;
    const statusName = typeof (o as {
        statusName?: string;
    }).statusName === 'string'
        ? (o as {
            statusName?: string;
        }).statusName?.trim()
        : undefined;
    return {
        id: String(o.outletId),
        name: o.outletName ?? '',
        status: mapOutletStatus(o.status),
        statusRaw: raw,
        statusName: statusName || undefined,
        totalItems: 0,
        paymentStatus: 'PENDING',
        assignedToSubMerchant: o.subMerchantId != null,
        assignedToSubMerchantId: o.subMerchantId != null ? String(o.subMerchantId) : null,
        location: formatOutletLocation(o),
        contactNumber: o.contactNumber,
        latitude: o.latitude,
        longitude: o.longitude,
        subMerchantName: o.subMerchantName,
        subMerchantInfo: undefined,
    };
}
export async function fetchOutletDetails(id: string): Promise<OutletDetailsResponse | null> {
    try {
        const { data } = await apiClient.get<OutletDetailsResponse>(API_ENDPOINTS.outletDetails(id));
        return data ?? null;
    }
    catch {
        return null;
    }
}
export async function fetchOutlets(_role: UserRole, _token: string): Promise<Outlet[]> {
    try {
        const { data } = await apiClient.get<OutletDto[]>('/api/outlets');
        return (data || []).map(toOutlet);
    }
    catch {
        return [
            { id: '1', name: 'Downtown Branch', status: 'OPEN', totalItems: 45, paymentStatus: 'PAID' },
            { id: '2', name: 'Mall Outlet', status: 'OPEN', totalItems: 62, paymentStatus: 'PENDING' },
        ];
    }
}
export interface CreateOutletPayload {
    merchantId: number;
    subMerchantId: number | null;
    outletName: string;
    businessRegistrationNumber?: string;
    taxIdentificationNumber?: string;
    postalCode?: string;
    provinceId?: number;
    districtId?: number;
    cityId?: number;
    contactNumber?: string;
    emailAddress?: string;
    addressLine1?: string;
    addressLine2?: string;
    outletType?: string;
    businessCategory?: string;
    latitude?: number;
    longitude?: number;
    bankName?: string;
    bankBranch?: string;
    accountNumber?: string;
    accountHolderName?: string;
    remarks?: string;
}
export async function createOutlet(payload: CreateOutletPayload): Promise<OutletDto> {
    const { data } = await apiClient.post<OutletDto>('/api/outlets', payload);
    return data;
}
export interface UpdateOutletPayload {
    outletName?: string;
    contactNumber?: string;
    emailAddress?: string;
    addressLine1?: string;
    postalCode?: string;
    provinceId?: number;
    districtId?: number;
    cityId?: number;
    latitude?: number;
    longitude?: number;
    outletType?: string;
    businessCategory?: string;
    subMerchantId?: number | null;
}
export async function updateOutletApi(id: string, payload: UpdateOutletPayload): Promise<void> {
    await apiClient.put(API_ENDPOINTS.outletById(id), payload);
}
export async function setOutletStatusApi(id: string, status: string): Promise<void> {
    await apiClient.put(API_ENDPOINTS.adminOutletStatus(id), { status });
}
export async function approveOutletApi(id: string): Promise<void> {
    await apiClient.put(API_ENDPOINTS.outletApprove(id));
}
export const outletService = {
    list: (role: UserRole) => apiClient.get<OutletDto[]>('/api/outlets', { params: { role } }),
    getById: (id: string) => apiClient.get<OutletDto>(`/api/outlets/${id}`),
    create: (data: CreateOutletPayload) => apiClient.post<OutletDto>('/api/outlets', data),
    update: (id: string, data: Partial<OutletDto> | UpdateOutletPayload) => apiClient.put<OutletDto>(API_ENDPOINTS.outletById(id), data),
    updateOutletApi,
    delete: (id: string) => apiClient.delete(`/api/outlets/${id}`),
    setOutletStatus: setOutletStatusApi,
};

import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/utils/apiClient';
export interface UpdateSubMerchantPayload {
    merchantName?: string;
    merchantEmail?: string;
    merchantAddress?: string;
    merchantPhoneNumber?: string;
    [key: string]: unknown;
}
export interface SubMerchantListItem {
    subMerchantId: number;
    merchantName?: string;
    merchantEmail?: string;
    [key: string]: unknown;
}
export async function fetchSubMerchants(): Promise<SubMerchantListItem[]> {
    const { data } = await apiClient.get<SubMerchantListItem[] | {
        subMerchants?: SubMerchantListItem[];
    }>(API_ENDPOINTS.subMerchants);
    if (Array.isArray(data))
        return data;
    if (data && typeof data === 'object' && Array.isArray((data as {
        subMerchants?: SubMerchantListItem[];
    }).subMerchants)) {
        return (data as {
            subMerchants: SubMerchantListItem[];
        }).subMerchants;
    }
    return [];
}
export interface CreateSubMerchantPayload {
    merchantName: string;
    merchantEmail: string;
    merchantNic: string | null;
    merchantProfileImage: string | null;
    merchantAddress: string;
    merchantPhoneNumber: string;
    merchantType: string;
    parentMerchantId: number;
    username: string;
    password: string;
}
export interface CreateSubMerchantResponse {
    status?: string;
    responseCode?: string;
    responseMessage?: string;
    [key: string]: unknown;
}
export async function createSubMerchant(payload: CreateSubMerchantPayload): Promise<CreateSubMerchantResponse> {
    const { data } = await apiClient.post<CreateSubMerchantResponse>(API_ENDPOINTS.merchantOnboarding, payload);
    return data;
}
export interface UpdateMerchantProfilePayload {
    merchantName?: string;
    merchantEmail?: string;
    merchantNic?: string | null;
    merchantProfileImage?: string | null;
    merchantAddress?: string;
    merchantPhoneNumber?: string;
    merchantType?: string;
}
export async function updateMerchantProfile(payload: UpdateMerchantProfilePayload): Promise<CreateSubMerchantResponse> {
    const { data } = await apiClient.put<CreateSubMerchantResponse>(API_ENDPOINTS.merchantsProfile, payload);
    return data;
}
export async function updateSubMerchant(subMerchantId: number, payload: UpdateSubMerchantPayload): Promise<CreateSubMerchantResponse> {
    const { data } = await apiClient.put<CreateSubMerchantResponse>(API_ENDPOINTS.subMerchantById(subMerchantId), payload);
    return data;
}
export async function deleteSubMerchant(subMerchantId: number): Promise<void> {
    await apiClient.put(API_ENDPOINTS.subMerchantStatus(subMerchantId), {
        status: 'DELETED',
        inactiveReason: '',
    });
}
export async function approveSubMerchant(subMerchantId: number): Promise<CreateSubMerchantResponse> {
    const { data } = await apiClient.put<CreateSubMerchantResponse>(API_ENDPOINTS.subMerchantApprove(subMerchantId));
    return data;
}
export async function rejectSubMerchant(subMerchantId: number, reason: string = ''): Promise<CreateSubMerchantResponse> {
    const { data } = await apiClient.put<CreateSubMerchantResponse>(API_ENDPOINTS.subMerchantReject(subMerchantId), { reason: reason || 'Rejected by merchant' });
    return data;
}

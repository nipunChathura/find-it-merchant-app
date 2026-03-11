import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/utils/apiClient';

/** Payload for updating sub-merchant details */
export interface UpdateSubMerchantPayload {
  merchantName?: string;
  merchantEmail?: string;
  merchantAddress?: string;
  merchantPhoneNumber?: string;
  [key: string]: unknown;
}

/** Sub-merchant item from GET /api/merchant-app/sub-merchants */
export interface SubMerchantListItem {
  subMerchantId: number;
  merchantName?: string;
  merchantEmail?: string;
  [key: string]: unknown;
}

/**
 * Fetch sub-merchants for the current merchant.
 * GET /api/merchant-app/sub-merchants
 * Uses Bearer token from SecureStore (apiClient).
 */
export async function fetchSubMerchants(): Promise<SubMerchantListItem[]> {
  const { data } = await apiClient.get<
    SubMerchantListItem[] | { subMerchants?: SubMerchantListItem[] }
  >(API_ENDPOINTS.subMerchants);
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray((data as { subMerchants?: SubMerchantListItem[] }).subMerchants)) {
    return (data as { subMerchants: SubMerchantListItem[] }).subMerchants;
  }
  return [];
}

/** Payload for POST /api/merchant-app/onboarding (add sub-merchant) */
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

/**
 * Add a sub-merchant via merchant-app onboarding API.
 * POST /api/merchant-app/onboarding
 * Uses Bearer token from SecureStore (apiClient) if required.
 */
export async function createSubMerchant(
  payload: CreateSubMerchantPayload
): Promise<CreateSubMerchantResponse> {
  const { data } = await apiClient.post<CreateSubMerchantResponse>(
    API_ENDPOINTS.merchantOnboarding,
    payload
  );
  return data;
}

/** Payload for PUT /api/merchants/profile (logged-in merchant profile) */
export interface UpdateMerchantProfilePayload {
  merchantName?: string;
  merchantEmail?: string;
  merchantNic?: string | null;
  merchantProfileImage?: string | null;
  merchantAddress?: string;
  merchantPhoneNumber?: string;
  merchantType?: string;
}

/**
 * Update logged-in merchant profile. PUT /api/merchants/profile
 */
export async function updateMerchantProfile(
  payload: UpdateMerchantProfilePayload
): Promise<CreateSubMerchantResponse> {
  const { data } = await apiClient.put<CreateSubMerchantResponse>(
    API_ENDPOINTS.merchantsProfile,
    payload
  );
  return data;
}

/**
 * Update sub-merchant details. PUT /api/merchants/sub-merchants/:id
 */
export async function updateSubMerchant(
  subMerchantId: number,
  payload: UpdateSubMerchantPayload
): Promise<CreateSubMerchantResponse> {
  const { data } = await apiClient.put<CreateSubMerchantResponse>(
    API_ENDPOINTS.subMerchantById(subMerchantId),
    payload
  );
  return data;
}

/**
 * Delete sub-merchant. PUT /api/merchants/sub-merchants/:id/status with status DELETED.
 */
export async function deleteSubMerchant(subMerchantId: number): Promise<void> {
  await apiClient.put(API_ENDPOINTS.subMerchantStatus(subMerchantId), {
    status: 'DELETED',
    inactiveReason: '',
  });
}

/**
 * Approve sub-merchant (status PENDING → APPROVED/ACTIVE).
 * PUT /api/merchants/sub-merchants/:id/approve
 */
export async function approveSubMerchant(subMerchantId: number): Promise<CreateSubMerchantResponse> {
  const { data } = await apiClient.put<CreateSubMerchantResponse>(
    API_ENDPOINTS.subMerchantApprove(subMerchantId)
  );
  return data;
}

/**
 * Reject sub-merchant (status PENDING → REJECTED/INACTIVE).
 * PUT /api/merchants/sub-merchants/:id/reject with body { reason }.
 */
export async function rejectSubMerchant(
  subMerchantId: number,
  reason: string = ''
): Promise<CreateSubMerchantResponse> {
  const { data } = await apiClient.put<CreateSubMerchantResponse>(
    API_ENDPOINTS.subMerchantReject(subMerchantId),
    { reason: reason || 'Rejected by merchant' }
  );
  return data;
}

import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/utils/apiClient';

/** Single payment from GET /api/merchant-app/outlets/:id/payment-details */
export interface OutletPaymentDetail {
  amount: number;
  outletId: number;
  outletName?: string;
  paidMonth: string;
  paymentDate: string;
  paymentId: number;
  paymentStatus: string;
  paymentType: string;
  receiptImage?: string | null;
}

/** Request body for POST /api/payments */
export interface SubmitPaymentPayload {
  outletId: number;
  paymentType: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paidMonth: string;   // YYYY-MM
  receiptImage: string | null;
  status: string;      // e.g. ACTIVE
}

/** Request body for PUT /api/payments/:id */
export interface UpdatePaymentPayload {
  outletId: number;
  paymentType: string;
  amount: number;
  paymentDate: string;
  paidMonth: string;
  receiptImage: string | null;
  status: string;
}

export interface PaymentDto {
  id: string;
  outletId: string;
  amount: number;
  month: string;
  status: string;
  receiptUrl?: string;
  createdAt: string;
}

/** Response from POST /api/images/upload - image name to pass as receiptImage */
export interface ImageUploadResponse {
  imageName?: string;
  fileName?: string;
  name?: string;
  [key: string]: unknown;
}

/**
 * Submit a payment. POST /api/payments
 * Bearer token sent by apiClient.
 */
export async function submitPayment(payload: SubmitPaymentPayload): Promise<unknown> {
  const { data } = await apiClient.post<unknown>(API_ENDPOINTS.payments, payload);
  return data;
}

/**
 * Update a payment. PUT /api/payments/:id
 * Bearer token sent by apiClient.
 */
export async function updatePayment(
  paymentId: number,
  payload: UpdatePaymentPayload
): Promise<unknown> {
  const { data } = await apiClient.put<unknown>(API_ENDPOINTS.paymentById(paymentId), payload);
  return data;
}

/**
 * Delete a payment. DELETE /api/payments/:id
 * Bearer token sent by apiClient.
 */
export async function deletePayment(paymentId: number): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.paymentById(paymentId));
}

/**
 * Upload an image. POST /api/images/upload (multipart).
 * Returns the image name to use in receiptImage for submitPayment.
 */
export async function uploadImage(
  fileUri: string,
  type: string = 'receipt'
): Promise<string | null> {
  const formData = new FormData();
  const filename = fileUri.split('/').pop() || 'image.jpg';
  const mime = filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
  formData.append('file', {
    uri: fileUri,
    type: mime,
    name: filename,
  } as unknown as Blob);
  formData.append('type', type);

  const { data } = await apiClient.post<ImageUploadResponse>(API_ENDPOINTS.imageUpload, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const name =
    (data && (data.imageName ?? data.fileName ?? data.name)) as string | undefined;
  return name ?? null;
}

/**
 * Fetch payment details for an outlet.
 * GET /api/merchant-app/outlets/:id/payment-details
 * Bearer token sent by apiClient.
 */
export async function fetchOutletPaymentDetails(
  outletId: string
): Promise<OutletPaymentDetail[]> {
  const { data } = await apiClient.get<OutletPaymentDetail[]>(
    API_ENDPOINTS.outletPaymentDetails(outletId)
  );
  return Array.isArray(data) ? data : [];
}

/**
 * Build source for showing images via GET /api/images/show?type=&fileName= (Bearer token).
 * Used on: item list (outlet Items tab), item details, discount list (outlet Discounts tab), discount details.
 * Use with Image: source={getImageShowSource(token, 'item', item.itemImage)}.
 * Only call when fileName is present; otherwise the Image will not load.
 */
export function getImageShowSource(
  token: string | null,
  type: 'receipt' | 'profile' | 'discount' | 'item',
  fileName: string | null | undefined
): { uri: string; headers?: { Authorization: string } } {
  if (!fileName || typeof fileName !== 'string') {
    return { uri: '' };
  }
  const fileNameForApi =
    type === 'item' && fileName.startsWith('item/')
      ? fileName.slice(5)
      : type === 'profile' && fileName.startsWith('profile/')
        ? fileName.slice(8)
        : fileName;
  const encoded = encodeURIComponent(fileNameForApi);
  const uri = `${API_BASE_URL}${API_ENDPOINTS.imageShow}?type=${type}&fileName=${encoded}`;
  if (!token) return { uri };
  return { uri, headers: { Authorization: `Bearer ${token}` } };
}

export const paymentService = {
  list: () => apiClient.get<PaymentDto[]>('/api/payments'),
  getByOutlet: (outletId: string) =>
    apiClient.get<PaymentDto[]>(`/api/outlets/${outletId}/payments`),
  fetchOutletPaymentDetails,
  getImageShowSource,
  submitPayment,
  uploadImage,
};

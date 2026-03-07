import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/utils/apiClient';

/** Request body for POST /api/payments */
export interface SubmitPaymentPayload {
  outletId: number;
  paymentType: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paidMonth: string;    // YYYY-MM
  receiptImage: string | null;
  status: string;      // e.g. ACTIVE
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

export const paymentService = {
  list: () => apiClient.get<PaymentDto[]>('/api/payments'),
  getByOutlet: (outletId: string) =>
    apiClient.get<PaymentDto[]>(`/api/outlets/${outletId}/payments`),
  submitPayment,
  uploadImage,
};

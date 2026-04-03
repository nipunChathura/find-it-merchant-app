import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/utils/apiClient';
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
export interface SubmitPaymentPayload {
    outletId: number;
    paymentType: string;
    amount: number;
    paymentDate: string;
    paidMonth: string;
    receiptImage: string | null;
    status: string;
}
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
export interface ImageUploadResponse {
    imageName?: string;
    fileName?: string;
    name?: string;
    [key: string]: unknown;
}
export async function submitPayment(payload: SubmitPaymentPayload): Promise<unknown> {
    const { data } = await apiClient.post<unknown>(API_ENDPOINTS.payments, payload);
    return data;
}
export async function updatePayment(paymentId: number, payload: UpdatePaymentPayload): Promise<unknown> {
    const { data } = await apiClient.put<unknown>(API_ENDPOINTS.paymentById(paymentId), payload);
    return data;
}
export async function deletePayment(paymentId: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.paymentById(paymentId));
}
export async function uploadImage(fileUri: string, type: string = 'receipt'): Promise<string | null> {
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
    const name = (data && (data.imageName ?? data.fileName ?? data.name)) as string | undefined;
    return name ?? null;
}
export async function fetchOutletPaymentDetails(outletId: string): Promise<OutletPaymentDetail[]> {
    const { data } = await apiClient.get<OutletPaymentDetail[]>(API_ENDPOINTS.outletPaymentDetails(outletId));
    return Array.isArray(data) ? data : [];
}
export function getImageShowSource(token: string | null, type: 'receipt' | 'profile' | 'discount' | 'item', fileName: string | null | undefined): {
    uri: string;
    headers?: {
        Authorization: string;
    };
} {
    if (!fileName || typeof fileName !== 'string') {
        return { uri: '' };
    }
    const fileNameForApi = type === 'item' && fileName.startsWith('item/')
        ? fileName.slice(5)
        : type === 'profile' && fileName.startsWith('profile/')
            ? fileName.slice(8)
            : fileName;
    const encoded = encodeURIComponent(fileNameForApi);
    const uri = `${API_BASE_URL}${API_ENDPOINTS.imageShow}?type=${type}&fileName=${encoded}`;
    if (!token)
        return { uri };
    return { uri, headers: { Authorization: `Bearer ${token}` } };
}
export const paymentService = {
    list: () => apiClient.get<PaymentDto[]>('/api/payments'),
    getByOutlet: (outletId: string) => apiClient.get<PaymentDto[]>(`/api/outlets/${outletId}/payments`),
    fetchOutletPaymentDetails,
    getImageShowSource,
    submitPayment,
    uploadImage,
};

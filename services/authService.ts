import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/utils/apiClient';
export interface LoginPayload {
    username: string;
    password: string;
}
export interface MainMerchantInfo {
    merchantAddress?: string;
    merchantEmail?: string;
    merchantId?: number;
    merchantName?: string;
    merchantNic?: string;
    merchantPhoneNumber?: string;
    merchantType?: string;
    profileImage?: string | null;
    status?: string;
}
export interface SubMerchantInfo {
    merchantAddress?: string;
    merchantEmail?: string;
    merchantName?: string;
    merchantNic?: string;
    merchantPhoneNumber?: string;
    merchantType?: string;
    profileImage?: string | null;
    status?: string;
    subMerchantId?: number;
}
export interface MerchantLoginResponse {
    status: string;
    responseCode: string;
    responseMessage: string;
    role: 'MERCHANT' | 'SUBMERCHANT';
    token: string;
    userId: number;
    userStatus: string;
    username: string;
    merchantId?: number;
    mainMerchantInfo?: MainMerchantInfo;
    subMerchantId?: number;
    subMerchantInfo?: SubMerchantInfo;
    profileImage?: string | null;
    profileImageUrl?: string | null;
}
export interface RegisterPayload {
    name: string;
    email: string;
    phone: string;
    password: string;
}
export interface MerchantOnboardingPayload {
    merchantName: string;
    merchantEmail: string;
    merchantNic: string;
    merchantProfileImage: string | null;
    merchantAddress: string;
    merchantPhoneNumber: string;
    merchantType?: string;
    username: string;
    password: string;
}
export interface MerchantOnboardingResponse {
    status: string;
    responseCode: string;
    responseMessage: string;
    merchantId?: number;
    merchantName?: string;
    merchantEmail?: string;
    merchantNic?: string;
    merchantAddress?: string;
    merchantPhoneNumber?: string;
    merchantStatus?: string;
    merchantType?: string;
    username?: string;
}
export interface ForgotPasswordPayload {
    email: string;
}
export interface ResetPasswordPayload {
    token: string;
    newPassword: string;
    confirmPassword: string;
}
export interface UpdateMerchantProfilePayload {
    merchantName: string;
    merchantEmail: string;
    merchantNic: string;
    merchantProfileImage: string | null;
    merchantAddress: string;
    merchantPhoneNumber: string;
    merchantType: string;
}
export interface UpdateProfileImageResponse {
    profileImageUrl?: string | null;
    profileImage?: string | null;
    [key: string]: unknown;
}
export const authService = {
    login: (data: LoginPayload) => apiClient.post<{
        status: string;
        responseCode: string;
        token: string;
        role: string;
        username: string;
        userId: number;
        userStatus: string;
        responseMessage: string;
    }>(API_ENDPOINTS.login, data),
    merchantLogin: (data: LoginPayload) => apiClient.post<MerchantLoginResponse>(API_ENDPOINTS.merchantLogin, data),
    updateMerchantProfile: (payload: UpdateMerchantProfilePayload) => apiClient.put<{
        status?: string;
        responseMessage?: string;
    }>(API_ENDPOINTS.merchantAppProfile, payload),
    updateProfileImage: (fileName: string) => apiClient.put<UpdateProfileImageResponse>(API_ENDPOINTS.merchantProfileImage, { fileName }),
    changePassword: (currentPassword: string, newPassword: string) => apiClient.put<{
        status?: string;
        responseMessage?: string;
    }>(API_ENDPOINTS.merchantPassword, {
        currentPassword,
        newPassword,
    }),
    register: (data: RegisterPayload) => apiClient.post('/api/users/register', data),
    merchantOnboarding: (data: MerchantOnboardingPayload) => apiClient.post<MerchantOnboardingResponse>(API_ENDPOINTS.merchantOnboarding, {
        ...data,
        merchantType: 'FREE',
    }),
    forgotPassword: (data: ForgotPasswordPayload) => apiClient.post('/api/users/forgot-password', data),
    resetPassword: (data: ResetPasswordPayload) => apiClient.post('/api/users/reset-password', data),
};

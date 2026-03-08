import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/utils/apiClient';

export interface LoginPayload {
  username: string;
  password: string;
}

/** Main merchant info (returned for both MERCHANT and SUBMERCHANT login) */
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

/** Sub-merchant info (only when role is SUBMERCHANT) */
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
  /** Profile image filename for GET /api/images/show?type=profile&fileName= */
  profileImage?: string | null;
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
  merchantType: string;
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

/** Request body for PUT /api/merchant-app/profile */
export interface UpdateMerchantProfilePayload {
  merchantName: string;
  merchantEmail: string;
  merchantNic: string;
  merchantProfileImage: string | null;
  merchantAddress: string;
  merchantPhoneNumber: string;
  merchantType: string;
}

/** Response from PUT /api/merchant-app/profile/image */
export interface UpdateProfileImageResponse {
  profileImageUrl?: string | null;
  profileImage?: string | null;
  [key: string]: unknown;
}

export const authService = {
  login: (data: LoginPayload) =>
    apiClient.post<{ status: string; responseCode: string; token: string; role: string; username: string; userId: number; userStatus: string; responseMessage: string }>(API_ENDPOINTS.login, data),

  /** Merchant app login - supports MERCHANT and SUBMERCHANT roles */
  merchantLogin: (data: LoginPayload) =>
    apiClient.post<MerchantLoginResponse>(API_ENDPOINTS.merchantLogin, data),

  /** PUT merchant profile. Body: merchantName, merchantEmail, merchantNic, merchantProfileImage, merchantAddress, merchantPhoneNumber, merchantType. */
  updateMerchantProfile: (payload: UpdateMerchantProfilePayload) =>
    apiClient.put<{ status?: string; responseMessage?: string }>(API_ENDPOINTS.merchantAppProfile, payload),

  /** PUT merchant profile image. Body: { fileName }. Returns profileImageUrl (filename for image show). */
  updateProfileImage: (fileName: string) =>
    apiClient.put<UpdateProfileImageResponse>(API_ENDPOINTS.merchantProfileImage, { fileName }),

  /** PUT merchant password. Body: { currentPassword, newPassword }. Bearer token required. */
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.put<{ status?: string; responseMessage?: string }>(API_ENDPOINTS.merchantPassword, {
      currentPassword,
      newPassword,
    }),

  register: (data: RegisterPayload) =>
    apiClient.post('/api/users/register', data),

  /** Merchant onboarding - main merchant registration */
  merchantOnboarding: (data: MerchantOnboardingPayload) =>
    apiClient.post<MerchantOnboardingResponse>(API_ENDPOINTS.merchantOnboarding, data),

  forgotPassword: (data: ForgotPasswordPayload) =>
    apiClient.post('/api/users/forgot-password', data),

  resetPassword: (data: ResetPasswordPayload) =>
    apiClient.post('/api/users/reset-password', data),
};

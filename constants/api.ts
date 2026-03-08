import { Platform } from 'react-native';

/**
 * API base URL - uses 192.168.8.160:9090 (backend server port).
 */
const API_BASE_URL_OVERRIDE: string | null = 'http://192.168.8.160:9090/find-it';

/**
 * API base URL.
 * - When API_BASE_URL_OVERRIDE is set, all API calls use that URL.
 * - Otherwise: Android emulator uses 10.0.2.2, iOS/web uses localhost (port 9090).
 */
const getApiBaseUrl = (): string => {
  if (API_BASE_URL_OVERRIDE) return API_BASE_URL_OVERRIDE;
  if (__DEV__ && Platform.OS === 'android') {
    return 'http://10.0.2.2:9090/find-it';
  }
  return 'http://localhost:9090/find-it';
};

export const API_BASE_URL = getApiBaseUrl();

export const API_ENDPOINTS = {
  login: '/api/users/login',
  merchantLogin: '/api/merchant-app/login',
  merchantOnboarding: '/api/merchant-app/onboarding',
  merchantDashboard: '/api/merchant-app/dashboard',
  /** GET - list sub-merchants for current merchant. Bearer token required */
  subMerchants: '/api/merchant-app/sub-merchants',
  /** PUT - update sub-merchant details */
  subMerchantById: (subMerchantId: number) => `/api/merchants/sub-merchants/${subMerchantId}`,
  /** PUT - approve sub-merchant (no body) */
  subMerchantApprove: (subMerchantId: number) => `/api/merchants/sub-merchants/${subMerchantId}/approve`,
  /** PUT - reject sub-merchant (body: { reason }) */
  subMerchantReject: (subMerchantId: number) => `/api/merchants/sub-merchants/${subMerchantId}/reject`,
  /** PUT - set status (body: { status: "DELETED" | "ACTIVE", inactiveReason }) */
  subMerchantStatus: (subMerchantId: number) => `/api/merchants/sub-merchants/${subMerchantId}/status`,
  /** PUT - update logged-in merchant profile */
  merchantsProfile: '/api/merchants/profile',
  /** PUT - update merchant profile (name, email, nic, address, phone, type, profile image). Bearer token required */
  merchantAppProfile: '/api/merchant-app/profile',
  /** PUT - update merchant profile image. Body: { fileName }. Returns profileImageUrl. Bearer token required */
  merchantProfileImage: '/api/merchant-app/profile/image',
  /** PUT - change merchant password. Body: { currentPassword, newPassword }. Bearer token required */
  merchantPassword: '/api/merchant-app/password',
  outletsAssigned: '/api/outlets/assigned',
  /** GET - outlet details (outlet, merchantDetails, subMerchantDetails). Bearer token required */
  outletDetails: (id: string) => `/api/merchant-app/outlets/${id}/details`,
  /** GET - outlet payment details (list of payments). Bearer token required */
  outletPaymentDetails: (id: string) => `/api/merchant-app/outlets/${id}/payment-details`,
  /** GET - outlet discount details (list of discounts). Bearer token required */
  outletDiscountDetails: (id: string) => `/api/merchant-app/outlets/${id}/discount-details`,
  /** POST - create discount. Body: discountName, discountType, discountValue, startDate, endDate, status, itemIds. Bearer token required */
  discounts: '/api/discounts',
  /** PUT - update discount by id. Same body as POST. Bearer token required */
  discountById: (id: number) => `/api/discounts/${id}`,
  /** GET - outlet schedule details (NORMAL, EMERGENCY, TEMPORARY, DAILY). Bearer token required */
  outletScheduleDetails: (id: string) => `/api/merchant-app/outlets/${id}/schedule-details`,
  /** POST - create schedule. Same path as GET, body JSON. Bearer token required */
  outletScheduleCreate: (outletId: string) => `/api/merchant-app/outlets/${outletId}/schedule-details`,
  /** PUT - update schedule. Bearer token required */
  outletScheduleUpdate: (outletId: string, scheduleId: number) => `/api/outlets/${outletId}/schedules/${scheduleId}`,
  /** DELETE - remove schedule slot. Bearer token required */
  outletScheduleDelete: (outletId: string, scheduleId: number) => `/api/outlets/${outletId}/schedules/${scheduleId}`,
  /** DELETE - (legacy) merchant-app path for schedule delete */
  scheduleSlot: (outletId: string, scheduleId: number) => `/api/merchant-app/outlets/${outletId}/schedules/${scheduleId}`,
  /** PUT - update outlet (body: outletName, contactNumber, emailAddress, addressLine1, outletType, businessCategory) */
  outletById: (id: string) => `/api/outlets/${id}`,
  /** PUT - approve outlet (no body). Bearer token required */
  outletApprove: (id: string) => `/api/outlets/${id}/approve`,
  /** PUT - set outlet status (body: { status: "ACTIVE" | "DELETED" | "REJECTED" }) */
  adminOutletStatus: (id: string) => `/api/admin/outlets/${id}/status`,
  /** POST - submit payment. Bearer token required */
  payments: '/api/payments',
  /** PUT - update payment by id. DELETE - delete payment. Bearer token required */
  paymentById: (id: number) => `/api/payments/${id}`,
  /** POST - upload image (multipart). Bearer token required. Returns image name for receiptImage. */
  imageUpload: '/api/images/upload',
  /** GET - show image. Query: type (e.g. receipt, profile, discount, item), fileName. Bearer token required */
  imageShow: '/api/images/show',
  /** GET - list items. Query: search, categoryId, outletId, status, availability. Bearer token required */
  items: '/api/items',
  /** PUT - update item by id. Body: itemName, itemDescription, categoryId, outletId, price, availability, itemImage, status */
  itemById: (id: string) => `/api/items/${id}`,
  /** GET - list categories. Query: name, categoryType, status. Bearer token required */
  categories: '/api/categories',
  /** GET /api/notifications/unread/:userId - Bearer token required */
  notificationsUnread: (userId: string) => `/api/notifications/unread/${userId}`,
} as const;

export interface LoginRequestBody {
  username: string;
  password: string;
}

export interface LoginResponse {
  isSystemUser: string;
  responseCode: string;
  responseMessage: string;
  role: string;
  status: string;
  token: string;
  userId: number;
  userStatus: string;
  username: string;
}

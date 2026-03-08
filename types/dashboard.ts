export type UserRole = 'MERCHANT' | 'SUBMERCHANT';

export interface PendingPaymentDetail {
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

/** Payment item for list (dashboard + payments tab) */
export interface PaymentItem {
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

/** Sub-merchant item (dashboard API) */
export interface SubMerchantItem {
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
  /** Profile image filename for GET /api/images/show?type=profile&fileName= */
  profileImage?: string | null;
}

export interface DashboardSummary {
  totalOutlets: number;
  activeOutlets: number;
  totalItems: number;
  pendingPayments: number;
  pendingPaymentDetails?: PendingPaymentDetail[];
}

export type OutletStatus = 'OPEN' | 'CLOSED' | 'PENDING' | 'ACTIVE';
export type CurrentStatus = 'OPEN' | 'CLOSED';
export type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE';

export interface Outlet {
  id: string;
  name: string;
  /** Outlet status from API "status" (e.g. ACTIVE, PENDING) */
  status: OutletStatus;
  /** Open/closed from API "currentStatus" (OPEN, CLOSED) */
  currentStatus?: CurrentStatus;
  totalItems: number;
  paymentStatus: PaymentStatus;
  assignedToSubMerchant?: boolean;
  /** Assigned sub-merchant user id (for role-based filtering) */
  assignedToSubMerchantId?: string | null;
  location?: string;
  contactNumber?: string;
  description?: string;
  /** For map view */
  latitude?: number;
  longitude?: number;
  /** When assigned to sub-merchant (from assigned outlets API) */
  subMerchantName?: string;
  subMerchantInfo?: {
    merchantName?: string;
    merchantEmail?: string;
    merchantPhoneNumber?: string;
    merchantAddress?: string;
  };
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  icon?: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  primary?: boolean;
  onPress: () => void;
}

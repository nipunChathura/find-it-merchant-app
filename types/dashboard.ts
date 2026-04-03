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
    profileImage?: string | null;
}
export interface DashboardSummary {
    totalOutlets: number;
    activeOutlets: number;
    totalItems: number;
    pendingPayments: number;
    pendingPaymentDetails?: PendingPaymentDetail[];
}
export type OutletStatus = 'OPEN' | 'CLOSED' | 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'REJECTED' | 'DELETED' | 'UNKNOWN';
export type CurrentStatus = 'OPEN' | 'CLOSED';
export type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE';
export interface Outlet {
    id: string;
    name: string;
    status: OutletStatus;
    statusRaw?: string;
    statusName?: string;
    currentStatus?: CurrentStatus;
    totalItems: number;
    paymentStatus: PaymentStatus;
    assignedToSubMerchant?: boolean;
    assignedToSubMerchantId?: string | null;
    location?: string;
    contactNumber?: string;
    description?: string;
    latitude?: number;
    longitude?: number;
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
    readId?: string;
}
export interface QuickAction {
    id: string;
    label: string;
    icon: string;
    primary?: boolean;
    onPress: () => void;
}

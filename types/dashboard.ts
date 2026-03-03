export type UserRole = 'MERCHANT' | 'SUBMERCHANT';

export interface DashboardSummary {
  totalOutlets: number;
  activeOutlets: number;
  totalItems: number;
  pendingPayments: number;
}

export type OutletStatus = 'OPEN' | 'CLOSED';
export type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE';

export interface Outlet {
  id: string;
  name: string;
  status: OutletStatus;
  totalItems: number;
  paymentStatus: PaymentStatus;
  assignedToSubMerchant?: boolean;
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

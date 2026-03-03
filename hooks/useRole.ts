import { useMemo } from 'react';

import { useAuth } from '@/context/auth-context';
import type { UserRole } from '@/types';

const ROLE_MAP: Record<string, UserRole> = {
  MERCHANT: 'MERCHANT',
  SUBMERCHANT: 'SUBMERCHANT',
  SUB_MERCHANT: 'SUBMERCHANT',
};

export function useRole(): UserRole | null {
  const { user } = useAuth();
  return useMemo(() => {
    if (!user?.role) return null;
    return ROLE_MAP[user.role.toUpperCase()] ?? 'MERCHANT';
  }, [user?.role]);
}

export function useIsMerchant(): boolean {
  const role = useRole();
  return role === 'MERCHANT';
}

export function useIsSubMerchant(): boolean {
  const role = useRole();
  return role === 'SUBMERCHANT';
}

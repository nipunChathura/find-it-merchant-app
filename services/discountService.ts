import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/utils/apiClient';

/** Item inside a discount from GET outlet discount-details */
export interface OutletDiscountItemDto {
  itemId: number;
  itemName?: string;
}

/** Single discount from GET /api/merchant-app/outlets/:id/discount-details */
export interface OutletDiscountDetail {
  discountId: number;
  discountImage?: string | null;
  discountName?: string;
  discountStatus?: string;
  discountType?: string;
  discountValue: number;
  endDate?: string;
  itemIds?: number[];
  items?: OutletDiscountItemDto[];
  outletId: number;
  outletName?: string;
  startDate?: string;
}

/** Request body for POST /api/discounts and PUT /api/discounts/:id */
export interface CreateOrUpdateDiscountPayload {
  discountName: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  startDate: string;
  endDate: string;
  status: string;
  itemIds: number[];
}

/**
 * Fetch discount details for an outlet.
 * GET /api/merchant-app/outlets/:id/discount-details
 * Bearer token sent by apiClient.
 */
export async function fetchOutletDiscountDetails(
  outletId: string
): Promise<OutletDiscountDetail[]> {
  const { data } = await apiClient.get<OutletDiscountDetail[]>(
    API_ENDPOINTS.outletDiscountDetails(outletId)
  );
  return Array.isArray(data) ? data : [];
}

/**
 * Create a discount. POST /api/discounts
 * Bearer token sent by apiClient.
 */
export async function createDiscount(payload: CreateOrUpdateDiscountPayload): Promise<unknown> {
  const { data } = await apiClient.post<unknown>(API_ENDPOINTS.discounts, payload);
  return data;
}

/**
 * Update a discount. PUT /api/discounts/:id
 * Bearer token sent by apiClient.
 */
export async function updateDiscount(
  discountId: number,
  payload: CreateOrUpdateDiscountPayload
): Promise<unknown> {
  const { data } = await apiClient.put<unknown>(API_ENDPOINTS.discountById(discountId), payload);
  return data;
}

/**
 * Delete a discount. DELETE /api/discounts/:id
 * Bearer token sent by apiClient.
 */
export async function deleteDiscount(discountId: number): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.discountById(discountId));
}

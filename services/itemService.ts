import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/utils/apiClient';

export interface ItemDto {
  id: string;
  outletId: string;
  name: string;
  description?: string;
  price?: number;
  quantity?: number;
}

/** Item from GET /api/items (search/filter by outletId, etc.) */
export interface ItemApiDto {
  itemId: number;
  itemName: string;
  itemDescription?: string;
  itemImage?: string | null;
  price: number;
  categoryId?: number;
  categoryName?: string;
  categoryTypeName?: string;
  availability: boolean;
  discountAvailability?: boolean;
  status?: string;
  outletId: number;
  outletName?: string;
}

export const ITEMS_PAGE_SIZE = 5;

export interface FetchItemsParams {
  search?: string;
  categoryId?: number | string;
  outletId?: string;
  status?: string;
  availability?: string | boolean;
  page?: number;
  size?: number;
}

/**
 * Fetch items from GET /api/items with optional filters and pagination.
 * Pass outletId to get items for a specific outlet.
 * Pass page (0-based) and size for pagination (e.g. size 5 for 5 per page).
 */
export async function fetchItems(params: FetchItemsParams = {}): Promise<ItemApiDto[]> {
  const query: Record<string, string | number> = {
    search: params.search ?? '',
    categoryId: params.categoryId ?? '',
    outletId: params.outletId ?? '',
    status: params.status ?? '',
    availability: params.availability === true ? 'true' : params.availability === false ? 'false' : '',
  };
  if (params.page != null) query.page = params.page;
  if (params.size != null) query.size = params.size;
  const { data } = await apiClient.get<ItemApiDto[]>(API_ENDPOINTS.items, { params: query });
  return Array.isArray(data) ? data : [];
}

/** Request body for POST /api/items (create) */
export interface CreateItemRequestBody {
  itemName: string;
  itemDescription?: string | null;
  categoryId?: number | null;
  outletId: number;
  price: number;
  availability: boolean;
  itemImage?: string | null;
}

/** Request body for PUT /api/items/:itemId */
export interface UpdateItemRequestBody {
  itemName: string;
  itemDescription?: string | null;
  categoryId?: number | null;
  outletId: number;
  price: number;
  availability: boolean;
  itemImage?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

/**
 * Create an item. POST /api/items with full item body.
 * Bearer token sent by apiClient.
 */
export async function createItem(body: CreateItemRequestBody): Promise<unknown> {
  const { data } = await apiClient.post<unknown>(API_ENDPOINTS.items, body);
  return data;
}

/**
 * Update item by id. PUT /api/items/:itemId with full item body.
 */
export async function updateItemById(
  itemId: number | string,
  body: UpdateItemRequestBody
): Promise<void> {
  const url = API_ENDPOINTS.itemById(String(itemId));
  await apiClient.put(url, body);
}

/**
 * Update item status (Active/Inactive). PUT with { status }.
 * Backend may accept status: 'ACTIVE' | 'INACTIVE' or availability: boolean.
 */
export async function updateItemStatus(
  outletId: string,
  itemId: number | string,
  status: 'ACTIVE' | 'INACTIVE'
): Promise<void> {
  await apiClient.put(`/api/outlets/${outletId}/items/${itemId}`, { status });
}

/**
 * Delete an item by id. DELETE /api/items/:itemId
 */
export async function deleteItemById(itemId: number | string): Promise<void> {
  const url = API_ENDPOINTS.itemById(String(itemId));
  await apiClient.delete(url);
}

/**
 * Delete an item. DELETE /api/outlets/:outletId/items/:itemId (legacy)
 */
export async function deleteItem(outletId: string, itemId: number | string): Promise<void> {
  await apiClient.delete(`/api/outlets/${outletId}/items/${itemId}`);
}

export const itemService = {
  listByOutlet: (outletId: string) =>
    apiClient.get<ItemDto[]>(`/api/outlets/${outletId}/items`),
  fetchItems,
  createItem,
  updateItemById,
  updateItemStatus,
  deleteItemById,
  deleteItem,
  create: (outletId: string, data: Partial<ItemDto>) =>
    apiClient.post<ItemDto>(`/api/outlets/${outletId}/items`, data),
  update: (outletId: string, itemId: string, data: Partial<ItemDto>) =>
    apiClient.put<ItemDto>(`/api/outlets/${outletId}/items/${itemId}`, data),
  delete: (outletId: string, itemId: string) =>
    apiClient.delete(`/api/outlets/${outletId}/items/${itemId}`),
};

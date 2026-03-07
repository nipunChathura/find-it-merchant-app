import { apiClient } from '@/utils/apiClient';

export interface ItemDto {
  id: string;
  outletId: string;
  name: string;
  description?: string;
  price?: number;
  quantity?: number;
}

export const itemService = {
  listByOutlet: (outletId: string) =>
    apiClient.get<ItemDto[]>(`/api/outlets/${outletId}/items`),

  create: (outletId: string, data: Partial<ItemDto>) =>
    apiClient.post<ItemDto>(`/api/outlets/${outletId}/items`, data),

  update: (outletId: string, itemId: string, data: Partial<ItemDto>) =>
    apiClient.put<ItemDto>(`/api/outlets/${outletId}/items/${itemId}`, data),

  delete: (outletId: string, itemId: string) =>
    apiClient.delete(`/api/outlets/${outletId}/items/${itemId}`),
};

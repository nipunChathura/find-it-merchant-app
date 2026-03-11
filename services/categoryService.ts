import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/utils/apiClient';

export interface CategoryDto {
  categoryId?: number;
  id?: number;
  categoryName?: string;
  name?: string;
  categoryType?: string;
  status?: string;
  [key: string]: unknown;
}

export const CATEGORY_PAGE_SIZE = 5;

export interface FetchCategoriesParams {
  name?: string;
  categoryType?: string;
  status?: string;
  page?: number;
  size?: number;
}

/**
 * Fetch categories from GET /api/categories.
 * Query: name, categoryType, status (all optional), page, size for pagination.
 * Bearer token sent by apiClient.
 */
export async function fetchCategories(
  params: FetchCategoriesParams = {}
): Promise<CategoryDto[]> {
  const query: Record<string, string | number> = {
    name: params.name ?? '',
    categoryType: params.categoryType ?? '',
    status: params.status ?? '',
  };
  if (params.page != null) query.page = params.page;
  if (params.size != null) query.size = params.size;
  const { data } = await apiClient.get<CategoryDto[]>(API_ENDPOINTS.categories, {
    params: query,
  });
  if (!Array.isArray(data)) return [];
  return data;
}

/** Normalize category to { id, name } for dropdowns */
export function categoryToOption(c: CategoryDto): { id: number; name: string } {
  const id = c.categoryId ?? c.id ?? 0;
  const name = c.categoryName ?? c.name ?? `Category ${id}`;
  return { id, name };
}

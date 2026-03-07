import { apiClient } from '@/utils/apiClient';

export interface LocationOption {
  id: number;
  name: string;
}

/** Province item from GET /api/provinces response */
export interface ProvinceResponseItem {
  code: number;
  description: string;
  name: string;
  provinceId: number;
  responseCode?: string;
  status?: string;
}

/** Unwrap API response - may be array directly, or string (parse JSON), or { data: [] } */
function unwrapList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return unwrapList(parsed);
    } catch {
      return [];
    }
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.response)) return obj.response;
    if (Array.isArray(obj.list)) return obj.list;
    if (Array.isArray(obj.body)) return obj.body;
  }
  return [];
}

function getItemName(obj: Record<string, unknown>): string {
  const name = obj.name ?? obj.description ?? obj.provinceName ?? obj.districtName ?? obj.cityName ?? '';
  return String(name).trim();
}

function getItemId(obj: Record<string, unknown>, idKeys: string[]): number {
  for (const key of idKeys) {
    const val = obj[key];
    if (val != null && val !== '') {
      const n = Number(val);
      if (!isNaN(n)) return n;
    }
  }
  return 0;
}

/** GET /api/provinces?name=&description= - returns list like [{ provinceId, name, description, code, ... }] */
export async function fetchProvinces(params?: {
  name?: string;
  description?: string;
}): Promise<LocationOption[]> {
  const res = await apiClient.get<unknown>('/api/provinces', {
    params: { name: params?.name ?? '', description: params?.description ?? '' },
  });
  let data = res.data;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data) as unknown;
    } catch {
      return [];
    }
  }
  const list = unwrapList(data);
  const result: LocationOption[] = [];
  for (const item of list) {
    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      const id = getItemId(obj, ['provinceId', 'id', 'code']);
      const name = getItemName(obj) || (id ? `Province ${id}` : '');
      if (id > 0 || name) result.push({ id: id || result.length + 1, name });
    }
  }
  return result;
}

/** GET /api/provinces/:provinceId/districts?name= */
export async function fetchDistricts(
  provinceId: number,
  params?: { name?: string }
): Promise<LocationOption[]> {
  const { data } = await apiClient.get<LocationOption[] | unknown[]>(
    `/api/provinces/${provinceId}/districts`,
    { params: { name: params?.name ?? '' } }
  );
  return normalizeLocationList(data, 'districtId', 'districtName');
}

/** GET /api/districts/:districtId/cities?name= */
export async function fetchCities(
  districtId: number,
  params?: { name?: string }
): Promise<LocationOption[]> {
  const { data } = await apiClient.get<LocationOption[] | unknown[]>(
    `/api/districts/${districtId}/cities`,
    { params: { name: params?.name ?? '' } }
  );
  return normalizeLocationList(data, 'cityId', 'cityName');
}

function normalizeLocationList(
  raw: unknown,
  idKey: string,
  nameKey: string
): LocationOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      const id = Number(obj.id ?? obj[idKey]);
      const name = String(obj.name ?? obj[nameKey] ?? '');
      return { id: isNaN(id) ? 0 : id, name };
    }
    return { id: 0, name: '' };
  }).filter((o) => o.name || o.id);
}

/** Geocode a place in Sri Lanka (Nominatim). Returns center lat/long for map. */
export async function geocodeCity(
  cityName: string,
  districtName?: string,
  provinceName?: string
): Promise<{ latitude: number; longitude: number } | null> {
  const parts = [cityName, districtName, provinceName, 'Sri Lanka'].filter(Boolean);
  const q = parts.join(', ');
  if (!q.trim()) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
      q,
      format: 'json',
      limit: '1',
    })}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'FindItMerchantApp/1.0' },
    });
    const data = (await res.json()) as { lat?: string; lon?: string }[];
    const first = data?.[0];
    if (first?.lat != null && first?.lon != null) {
      const lat = parseFloat(first.lat);
      const lon = parseFloat(first.lon);
      if (!isNaN(lat) && !isNaN(lon)) return { latitude: lat, longitude: lon };
    }
  } catch {
    // ignore
  }
  return null;
}

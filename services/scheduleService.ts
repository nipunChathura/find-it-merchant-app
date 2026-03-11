import { API_ENDPOINTS } from '@/constants/api';
import { apiClient } from '@/utils/apiClient';

export const SCHEDULE_TYPES = ['NORMAL', 'EMERGENCY', 'DAILY', 'TEMPORARY'] as const;
export type ScheduleType = (typeof SCHEDULE_TYPES)[number];

export const SCHEDULE_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;

/** Request body for POST (create) and PUT (update) schedule */
export interface CreateSchedulePayload {
  scheduleType: ScheduleType;
  dayOfWeek: string | null;
  specialDate: string | null;
  startDate: string | null;
  endDate: string | null;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
  reason: string | null;
}

/** Weekly schedule slot - NORMAL */
export interface NormalScheduleSlot {
  id: number;
  dayOfWeek: string;
  openTime: string;
  closeTime: string;
  isClosed: string;
  priority?: number;
}

/** Special/emergency schedule slot - EMERGENCY, TEMPORARY, DAILY */
export interface SpecialScheduleSlot {
  id: number;
  specialDate?: string;
  startDate?: string;
  endDate?: string;
  openTime: string;
  closeTime: string;
  isClosed: string;
  reason?: string;
  priority?: number;
}

export interface OutletScheduleDetailsResponse {
  NORMAL?: NormalScheduleSlot[];
  EMERGENCY?: SpecialScheduleSlot[];
  TEMPORARY?: SpecialScheduleSlot[];
  DAILY?: SpecialScheduleSlot[];
}

const TIME_HHMM_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
export function isValidTimeHHmm(value: string): boolean {
  return TIME_HHMM_REGEX.test(value.trim());
}

/**
 * Fetch schedule details for an outlet.
 * GET /api/merchant-app/outlets/:id/schedule-details
 */
export async function fetchOutletScheduleDetails(
  outletId: string
): Promise<OutletScheduleDetailsResponse> {
  const { data } = await apiClient.get<OutletScheduleDetailsResponse>(
    API_ENDPOINTS.outletScheduleDetails(outletId)
  );
  return data ?? {};
}

/**
 * Create a schedule. POST /api/merchant-app/outlets/:outletId/schedule-details
 * For NORMAL with multiple days, call once per day (same payload, different dayOfWeek).
 */
export async function createSchedule(outletId: string, payload: CreateSchedulePayload): Promise<unknown> {
  const { data } = await apiClient.post<unknown>(API_ENDPOINTS.outletScheduleCreate(outletId), payload);
  return data;
}

/**
 * Update a schedule. PUT /api/outlets/:outletId/schedules/:scheduleId
 */
export async function updateScheduleSlot(
  outletId: string,
  scheduleId: number,
  payload: CreateSchedulePayload
): Promise<unknown> {
  const { data } = await apiClient.put<unknown>(
    API_ENDPOINTS.outletScheduleUpdate(outletId, scheduleId),
    payload
  );
  return data;
}

/**
 * Delete a schedule slot. DELETE /api/outlets/:outletId/schedules/:scheduleId
 */
export async function deleteScheduleSlot(outletId: string, scheduleId: number): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.outletScheduleDelete(outletId, scheduleId));
}

/** Find a schedule slot by id from the full schedule details response */
export function findScheduleSlotById(
  data: OutletScheduleDetailsResponse,
  scheduleId: number
): { type: ScheduleType; slot: NormalScheduleSlot | SpecialScheduleSlot } | null {
  if (data.NORMAL) {
    const slot = data.NORMAL.find((s) => s.id === scheduleId);
    if (slot) return { type: 'NORMAL', slot };
  }
  if (data.EMERGENCY) {
    const slot = data.EMERGENCY.find((s) => s.id === scheduleId);
    if (slot) return { type: 'EMERGENCY', slot };
  }
  if (data.DAILY) {
    const slot = data.DAILY.find((s) => s.id === scheduleId);
    if (slot) return { type: 'DAILY', slot };
  }
  if (data.TEMPORARY) {
    const slot = data.TEMPORARY.find((s) => s.id === scheduleId);
    if (slot) return { type: 'TEMPORARY', slot };
  }
  return null;
}

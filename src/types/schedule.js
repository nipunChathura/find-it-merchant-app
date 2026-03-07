/**
 * Schedule: dayOfWeek, openTime, closeTime
 */
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export { DAYS };

export function createSchedule(outletId, overrides = {}) {
  return {
    id: String(Date.now()),
    outletId,
    dayOfWeek: DAYS[0],
    openTime: '09:00',
    closeTime: '18:00',
    ...overrides,
  };
}

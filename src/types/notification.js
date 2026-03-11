export function createNotification(overrides = {}) {
  return {
    id: String(Date.now()),
    title: '',
    message: '',
    date: new Date().toISOString(),
    read: false,
    ...overrides,
  };
}

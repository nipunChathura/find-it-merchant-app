/**
 * Outlet: name, location, contactNumber, description, status (Open/Closed)
 */
export const OUTLET_STATUS = { OPEN: 'Open', CLOSED: 'Closed' };

export function createOutlet(overrides = {}) {
  return {
    id: String(Date.now()),
    name: '',
    location: '',
    contactNumber: '',
    description: '',
    status: OUTLET_STATUS.OPEN,
    assignedToSubMerchantId: null,
    ...overrides,
  };
}

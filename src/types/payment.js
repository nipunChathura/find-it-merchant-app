/**
 * Payment: outletId, month, amount, receiptUri
 */
export function createPayment(overrides = {}) {
  return {
    id: String(Date.now()),
    outletId: '',
    outletName: '',
    month: new Date().toISOString().slice(0, 7),
    paymentAmount: 0,
    receiptImageUri: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

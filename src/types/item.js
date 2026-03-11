/**
 * Item: name, price, category, description, availability
 */
export function createItem(outletId, overrides = {}) {
  return {
    id: String(Date.now()),
    outletId,
    name: '',
    price: 0,
    category: '',
    description: '',
    availability: true,
    ...overrides,
  };
}

const state = {
  products: [],
  selectedItems: new Map(),
};

/**
 * Get all products.
 *
 * @code PRD-getProducts
 * @returns {unknown[]}
 */
export function getProducts() {
  return state.products;
}

/**
 * Set all products.
 *
 * @code PRD-setProducts
 * @param {unknown[]} products
 */
export function setProducts(products) {
  state.products = products;
}

/**
 * Get the selected items map.
 *
 * @code PRD-getSelected
 * @returns {Map<number, unknown>}
 */
export function getSelectedItems() {
  return state.selectedItems;
}

/**
 * Get selected items as an array.
 *
 * @code PRD-getSelectedArray
 * @returns {Array<{ product_id: number, quantity: number, dispatch_uom: string, name: string, base_uom: string, image_path: string | null }>}
 */
export function getSelectedItemsArray() {
  return Array.from(state.selectedItems.entries()).map(([productId, item]) => {
    const product = state.products.find(p => p.product_id === productId);
    const quantity = typeof item === 'object' ? item.quantity : item;
    const dispatchUom = typeof item === 'object' ? item.dispatch_uom : (product?.base_uom || 'piece');
    return {
      product_id: productId,
      quantity,
      dispatch_uom: dispatchUom,
      name: product?.name || '',
      base_uom: product?.base_uom || 'piece',
      image_path: product?.image_path || null,
    };
  });
}

/**
 * Set quantity for a product in dispatch queue.
 *
 * @code PRD-setQuantity
 * @param {number} productId
 * @param {number} quantity
 * @param {string} [dispatchUom]
 */
export function setQuantity(productId, quantity, dispatchUom = null) {
  if (quantity <= 0) {
    state.selectedItems.delete(productId);
  } else {
    const product = state.products.find(p => p.product_id === productId);
    const current = state.selectedItems.get(productId);
    const existingUom = typeof current === 'object' ? current.dispatch_uom : null;
    const defaultUom = product?.base_uom || 'piece';
    state.selectedItems.set(productId, {
      quantity,
      dispatch_uom: dispatchUom || existingUom || defaultUom,
    });
  }
}

/**
 * Set dispatch unit of measure for a product.
 *
 * @code PRD-setUom
 * @param {number} productId
 * @param {string} dispatchUom
 */
export function setDispatchUom(productId, dispatchUom) {
  const current = state.selectedItems.get(productId);
  if (current) {
    state.selectedItems.set(productId, {
      quantity: typeof current === 'object' ? current.quantity : current,
      dispatch_uom: dispatchUom,
    });
  } else {
    state.selectedItems.set(productId, {
      quantity: 0,
      dispatch_uom: dispatchUom,
    });
  }
}

/**
 * Increment quantity by 1 for a product.
 *
 * @code PRD-increment
 * @param {number} productId
 */
export function incrementQuantity(productId) {
  const product = state.products.find(p => p.product_id === productId);
  const current = state.selectedItems.get(productId);
  const quantity = typeof current === 'object' ? current.quantity : (current || 0);
  const dispatchUom = typeof current === 'object' ? current.dispatch_uom : (product?.base_uom || 'piece');
  state.selectedItems.set(productId, { quantity: quantity + 1, dispatch_uom: dispatchUom });
}

/**
 * Decrement quantity by 1 for a product.
 *
 * @code PRD-decrement
 * @param {number} productId
 */
export function decrementQuantity(productId) {
  const product = state.products.find(p => p.product_id === productId);
  const current = state.selectedItems.get(productId);
  const quantity = typeof current === 'object' ? current.quantity : (current || 0);
  const dispatchUom = typeof current === 'object' ? current.dispatch_uom : (product?.base_uom || 'piece');
  if (quantity <= 1) {
    state.selectedItems.delete(productId);
  } else {
    state.selectedItems.set(productId, { quantity: quantity - 1, dispatch_uom: dispatchUom });
  }
}

/**
 * Remove a product from the dispatch queue.
 *
 * @code PRD-removeItem
 * @param {number} productId
 */
export function removeItem(productId) {
  state.selectedItems.delete(productId);
}

/**
 * Clear all selected items.
 *
 * @code PRD-clearSelection
 */
export function clearSelection() {
  state.selectedItems.clear();
}

/**
 * Check if there are any selected items.
 *
 * @code PRD-hasItems
 * @returns {boolean}
 */
export function hasItems() {
  return state.selectedItems.size > 0;
}
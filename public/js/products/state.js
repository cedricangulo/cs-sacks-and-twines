const state = {
  products: [],
  selectedItems: new Map(),
};

export function getProducts() {
  return state.products;
}

export function setProducts(products) {
  state.products = products;
}

export function getSelectedItems() {
  return state.selectedItems;
}

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

export function incrementQuantity(productId) {
  const product = state.products.find(p => p.product_id === productId);
  const current = state.selectedItems.get(productId);
  const quantity = typeof current === 'object' ? current.quantity : (current || 0);
  const dispatchUom = typeof current === 'object' ? current.dispatch_uom : (product?.base_uom || 'piece');
  state.selectedItems.set(productId, { quantity: quantity + 1, dispatch_uom: dispatchUom });
}

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

export function removeItem(productId) {
  state.selectedItems.delete(productId);
}

export function clearSelection() {
  state.selectedItems.clear();
}

export function hasItems() {
  return state.selectedItems.size > 0;
}
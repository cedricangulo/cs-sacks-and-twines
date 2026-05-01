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
  return Array.from(state.selectedItems.entries()).map(([productId, quantity]) => {
    const product = state.products.find(p => p.product_id === productId);
    return {
      product_id: productId,
      quantity,
      name: product?.name || '',
      base_uom: product?.base_uom || 'piece',
      image_path: product?.image_path || null,
    };
  });
}

export function setQuantity(productId, quantity) {
  if (quantity <= 0) {
    state.selectedItems.delete(productId);
  } else {
    state.selectedItems.set(productId, quantity);
  }
}

export function incrementQuantity(productId) {
  const current = state.selectedItems.get(productId) || 0;
  state.selectedItems.set(productId, current + 1);
}

export function decrementQuantity(productId) {
  const current = state.selectedItems.get(productId) || 0;
  if (current <= 1) {
    state.selectedItems.delete(productId);
  } else {
    state.selectedItems.set(productId, current - 1);
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
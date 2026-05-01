import { fetchJson } from '../utils/fetch-utils.js';
import { getSelectedItemsArray, clearSelection, setProducts } from './state.js';
import { getProductsList } from './get-products.js';
import { renderDispatchQueue, renderProductsGrid } from './render.js';
import { toast } from '../utils/toast.js';

let isSubmitting = false;

export async function submitDispatch(customerReference) {
  if (isSubmitting) return;

  const items = getSelectedItemsArray();
  if (items.length === 0) {
    return;
  }

  const grid = document.getElementById('products-grid');
  const dispatchUrl = grid?.getAttribute('data-dispatch-url') || '/api/stock-out';

  isSubmitting = true;

  try {
    const formData = new FormData();
    formData.append('customer_reference', customerReference || '');
    formData.append('items', JSON.stringify(items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      dispatch_uom: item.dispatch_uom || 'piece',
    }))));

    const response = await fetch(dispatchUrl, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'fetch',
      },
    });

    const payload = await response.json();

    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Failed to submit dispatch');
    }

    clearSelection();
    renderDispatchQueue();

    const products = await getProductsList();
    setProducts(products);
    grid.innerHTML = renderProductsGrid(products);

    return payload;
  } catch (error) {
    console.error('Dispatch error:', error);
    throw error;
  } finally {
    isSubmitting = false;
  }
}

export function initDispatchButton() {
  const dispatchBtn = document.getElementById('dispatch-btn');
  const customerRefInput = document.getElementById('customer-reference');

  if (!dispatchBtn) return;

  dispatchBtn.addEventListener('click', async () => {
    const customerReference = customerRefInput?.value?.trim() || '';

    dispatchBtn.disabled = true;
    dispatchBtn.textContent = 'Dispatching...';

    try {
      await submitDispatch(customerReference);

      if (customerRefInput) {
        customerRefInput.value = '';
      }

      toast.success('Dispatch completed successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to complete dispatch. Please try again.');
    } finally {
      dispatchBtn.disabled = false;
      dispatchBtn.textContent = 'Dispatch';
    }
  });
}
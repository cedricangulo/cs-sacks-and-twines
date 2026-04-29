import { createInventoryState } from './inventory/context.js';
import { initInventoryCombobox } from './inventory/combobox.js';
import { initInventoryModes } from './inventory/modes.js';
import { initInventorySubmission } from './inventory/submit.js';
import { resetForm } from './inventory/state.js';
import { getProducts } from './inventory/get-products.js';

function renderProducts(products) {
  if (products.length === 0) {
    return `
      <p class="text-center text-sm text-muted-foreground">
        No products found. Click "Add Inventory" to create a new product and add stock.
      </p>
    `;
  }

  const tableRows = products.map(product => `
    <tr>
      <td>${escapeHtml(product.sku_code)}</td>
      <td class="font-medium">${escapeHtml(product.name)}</td>
      <td>${escapeHtml(product.category)}</td>
      <td>${escapeHtml(product.base_uom)}</td>
      <td class="text-right">${escapeHtml(String(product.current_stock))}</td>
    </tr>
  `).join('');

  return `
    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Product Name</th>
            <th>Category</th>
            <th>Base Unit</th>
            <th class="text-right">Current Stock</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

async function loadProducts() {
  const container = document.getElementById('products-container');
  if (!container) return;

  try {
    const products = await getProducts();
    container.innerHTML = renderProducts(products);
  } catch (error) {
    console.error('Failed to load products:', error);
    container.innerHTML = `
      <p class="text-center text-sm text-destructive">
        Failed to load products. Please try again.
      </p>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const dialog = document.querySelector('[data-inventory-dialog]');
  const state = createInventoryState(dialog);

  if (!state) {
    return;
  }

  initInventoryCombobox(state);
  initInventoryModes(state);
  initInventorySubmission(state);

  state.dialog.addEventListener('close', () => {
    resetForm(state);
  });

  // Load products on initial page load
  loadProducts();

  // Hook into form submission to refresh products after save
  const form = document.querySelector('[data-inventory-form]');
  if (form) {
    const originalSubmit = form.onsubmit;
    form.addEventListener('submit', async (e) => {
      // Wait for form to complete, then reload products
      setTimeout(() => {
        loadProducts();
      }, 500);
    });
  }

  resetForm(state);
});

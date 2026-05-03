import { escapeHtml } from '../utils/dom-utils.js';
import { getSelectedItems, getSelectedItemsArray, setQuantity, setDispatchUom, incrementQuantity, decrementQuantity, removeItem } from './state.js';

function getDefaultImage(firstTwo) {
  return `<div class="aspect-video bg-muted flex items-center justify-center text-muted-foreground overflow-hidden type-lg font-medium">${firstTwo}</div>`;
}

function getProductImage(product) {
  const firstTwo = (product.name || '').slice(0, 2).toUpperCase();
  if (product.image_path) {
    const uploadsBase = (() => {
      const apiElem = document.querySelector('[data-api-url]');
      const api = apiElem?.getAttribute('data-api-url') || '/api';
      const pathname = new URL(api, window.location.origin).pathname;
      const idx = pathname.indexOf('/api');
      return idx !== -1 ? pathname.slice(0, idx) : '';
    })();

    const imageUrl = `${uploadsBase}/public/uploads/products/${escapeHtml(product.image_path)}`;
    return `<img src="${imageUrl}" class="aspect-video object-none object-center" alt="${escapeHtml(product.name || '')}" />`;
  }
  return getDefaultImage(firstTwo);
}

function getUnitToggle(product, selectedItem) {
  const category = product.category || '';
  const baseUom = product.base_uom || 'piece';
  const currentUom = selectedItem && typeof selectedItem === 'object' ? selectedItem.dispatch_uom : baseUom;

  if (category === 'sacks') {
    return '';
  }

  if (category === 'twines') {
    const isRoll = currentUom === 'roll';
    const isKilo = currentUom === 'kilo';
    return `
      <div role="group" class="button-group w-full border rounded-(--radius-md)" data-unit-toggle="${product.product_id}">
        <button type="button" class="flex-1 h-7! type-sm btn${isRoll ? '-secondary' : '-ghost'}" data-uom="roll">Roll</button>
        <button type="button" class="flex-1 h-7! type-sm btn${isKilo ? '-secondary' : '-ghost'}" data-uom="kilo">Kg</button>
      </div>
    `;
  }

  return '';
}

export function renderProductCard(product) {
  const selectedItems = getSelectedItems();
  const selectedItem = selectedItems.get(product.product_id);
  const quantity = typeof selectedItem === 'object' ? selectedItem.quantity : (selectedItem || 0);
  const stock = parseFloat(product.current_quantity) || 0;
  const baseUom = product.base_uom || 'piece';
  const isLowStock = stock < (parseFloat(product.low_stock_threshold) || 0);
  const isDisabled = stock <= 0;
  const isAtMax = quantity >= stock && stock > 0;

  return `
    <div class="card p-0 gap-0 justify-between overflow-hidden" data-product-id="${product.product_id}" data-stock="${stock}" data-category="${product.category || ''}">
      <div>
        <section class="px-0 max-h-32 overflow-hidden">
          ${getProductImage(product)}
        </section>
        <header class="p-2 border-t">
          <div class="flex w-full items-start justify-between gap-2">
            <h3 class="type-sm font-medium truncate">${escapeHtml(product.name || '')}</h3>
            ${isLowStock ? '<span class="badge-destructive type-xs">Low</span>' : ''}
          </div>
          <p class="mb-2 type-xs text-muted-foreground">${escapeHtml(product.sku_code || '')}</p>
          <span class="type-base text-muted-foreground">${stock} ${baseUom}</span>
        </header>
      </div>
      <footer class="p-2 flex flex-col gap-2">
        ${getUnitToggle(product, selectedItem)}
        <div role="group" class="button-group w-full" ${isDisabled ? 'aria-disabled="true"' : ''}>
          <button
            type="button"
            class="btn-icon-outline"
            data-action="decrement"
            ${isDisabled ? 'disabled' : ''}
            aria-label="Decrease quantity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"/>
            </svg>
          </button>
          <input
            type="number"
            class="input w-full text-center type-sm py-1"
            value="${quantity}"
            min="0"
            step="${product.category === 'twines' ? '0.01' : '1'}"
            max="${stock}"
            ${isDisabled ? 'disabled' : ''}
            ${isAtMax ? 'data-invalid' : ''}
            data-product-id="${product.product_id}"
            aria-invalid="${isAtMax}"
          />
          <button
            type="button"
            class="btn-icon-outline ${isAtMax ? 'opacity-50 cursor-not-allowed' : ''}"
            data-action="increment"
            ${isDisabled || isAtMax ? 'disabled' : ''}
            aria-label="Increase quantity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"/>
              <path d="M12 5v14"/>
            </svg>
          </button>
        </div>
      </footer>
    </div>
  `;
}

export function renderProductsGrid(products) {
  if (products.length === 0) {
    return `
      <div class="col-span-full flex items-center justify-center py-12">
        <div class="flex flex-col items-center justify-center gap-4 rounded-lg border-dashed p-8 text-center">
          <div class="flex max-w-sm flex-col items-center gap-3 text-center">
            <div class="bg-muted text-foreground flex size-12 shrink-0 items-center justify-center rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
            </div>
            <h3 class="text-lg font-medium tracking-tight">No Products</h3>
            <p class="text-muted-foreground text-sm/relaxed">Add your first product to start tracking inventory.</p>
          </div>
        </div>
      </div>
    `;
  }

  return products.map(renderProductCard).join('');
}

export function renderDispatchQueue() {
  const items = getSelectedItemsArray();
  const queueContainer = document.getElementById('dispatch-queue');
  const countContainer = document.getElementById('queue-count');
  const dispatchBtn = document.getElementById('dispatch-btn');

  if (items.length === 0) {
    if (queueContainer) {
      queueContainer.innerHTML = `
        <p class="type-sm text-muted-foreground text-center py-4">No items selected</p>
      `;
    }
    if (countContainer) {
      countContainer.textContent = '0 items selected';
    }
    if (dispatchBtn) {
      dispatchBtn.disabled = true;
    }
    return;
  }

  if (countContainer) {
    countContainer.textContent = `${items.length} item${items.length !== 1 ? 's' : ''} selected`;
  }

  if (dispatchBtn) {
    dispatchBtn.disabled = false;
  }

  if (queueContainer) {
    queueContainer.innerHTML = items.map(item => {
      const firstTwo = (item.name || '').slice(0, 2).toUpperCase();
      const imageHtml = item.image_path
        ? `<img src="${(() => { const apiElem = document.querySelector('[data-api-url]'); const api = apiElem?.getAttribute('data-api-url') || '/api'; const pathname = new URL(api, window.location.origin).pathname; const idx = pathname.indexOf('/api'); const base = idx !== -1 ? pathname.slice(0, idx) : ''; return `${base}/public/uploads/products/${escapeHtml(item.image_path)}`; })()}" class="size-10 object-cover rounded" alt="" />`
        : `<div class="size-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium">${firstTwo}</div>`;

      return `
        <div class="flex items-center gap-3 p-2 border rounded" data-product-id="${item.product_id}">
          ${imageHtml}
          <div class="flex-1 min-w-0">
            <p class="type-sm truncate">${escapeHtml(item.name || '')}</p>
            <p class="type-base font-semibold">
              ${item.quantity}
              <span class="type-xs text-muted-foreground">${item.dispatch_uom}</span>
            </p>
          </div>
          <button type="button" class="btn-icon-destructive" data-action="remove" title="Remove">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      `;
    }).join('');
  }
}

export function initProductCardHandlers(container) {
  container.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (button) {
      const card = button.closest('.card');
      const productId = card?.getAttribute('data-product-id');
      const stock = parseFloat(card?.getAttribute('data-stock')) || 0;
      if (!productId) return;

      const action = button.getAttribute('data-action');

      if (action === 'increment') {
        const selectedItem = getSelectedItems().get(parseInt(productId, 10));
        const currentQty = typeof selectedItem === 'object' ? selectedItem.quantity : (selectedItem || 0);
        if (currentQty >= stock) {
          return;
        }
        incrementQuantity(parseInt(productId, 10));
      } else if (action === 'decrement') {
        decrementQuantity(parseInt(productId, 10));
      }

      renderDispatchQueue();
      updateCardQuantity(parseInt(productId, 10));
      return;
    }

    const unitToggleBtn = event.target.closest('[data-unit-toggle] button[data-uom]');
    if (unitToggleBtn) {
      const toggleContainer = unitToggleBtn.closest('[data-unit-toggle]');
      const productId = toggleContainer?.getAttribute('data-unit-toggle');
      if (!productId) return;

      const newUom = unitToggleBtn.getAttribute('data-uom');
      setDispatchUom(parseInt(productId, 10), newUom);

      const card = container.querySelector(`.card[data-product-id="${productId}"]`);
      if (card) {
        const buttons = toggleContainer.querySelectorAll('button[data-uom]');
        buttons.forEach(btn => {
          const isSelected = btn.getAttribute('data-uom') === newUom;
          btn.classList.toggle('btn-secondary', isSelected);
          btn.classList.toggle('btn-ghost', !isSelected);
        });
      }

      renderDispatchQueue();
    }
  });

  container.addEventListener('input', (event) => {
    if (!event.target.matches('input[type="number"]')) return;

    const card = event.target.closest('.card');
    const productId = card?.getAttribute('data-product-id');
    const stock = parseFloat(card?.getAttribute('data-stock')) || 0;
    if (!productId) return;

    let value = parseFloat(event.target.value) || 0;
    if (value > stock) {
      value = stock;
      event.target.value = value;
    }
    setQuantity(parseInt(productId, 10), value);

    renderDispatchQueue();
    updateCardQuantity(parseInt(productId, 10));
  });
}

export function initQueueHandlers(container) {
  container.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const item = button.closest('[data-product-id]');
    const productId = item?.getAttribute('data-product-id');
    if (!productId) return;

    const action = button.getAttribute('data-action');

    if (action === 'increment') {
      incrementQuantity(parseInt(productId, 10));
    } else if (action === 'decrement') {
      decrementQuantity(parseInt(productId, 10));
    } else if (action === 'remove') {
      removeItem(parseInt(productId, 10));
    }

    renderDispatchQueue();
    updateCardQuantity(parseInt(productId, 10));
  });

  container.addEventListener('input', (event) => {
    if (!event.target.matches('input[type="number"]')) return;

    const item = event.target.closest('[data-product-id]');
    const productId = item?.getAttribute('data-product-id');
    if (!productId) return;

    const selectedItem = getSelectedItems().get(parseInt(productId, 10));
    const currentUom = typeof selectedItem === 'object' ? selectedItem.dispatch_uom : 'piece';
    const value = parseFloat(event.target.value) || 0;
    setQuantity(parseInt(productId, 10), value, currentUom);

    renderDispatchQueue();
  });
}

function updateCardQuantity(productId) {
  const card = document.querySelector(`.card[data-product-id="${productId}"]`);
  if (!card) return;

  const selectedItem = getSelectedItems().get(productId);
  const quantity = typeof selectedItem === 'object' ? selectedItem.quantity : (selectedItem || 0);
  const stock = parseFloat(card.getAttribute('data-stock')) || 0;
  const isAtMax = quantity >= stock && stock > 0;

  const input = card.querySelector('input[type="number"]');
  const incrementBtn = card.querySelector('button[data-action="increment"]');

  if (input) {
    input.value = quantity;
    if (isAtMax) {
      input.setAttribute('data-invalid', 'true');
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('data-invalid');
      input.removeAttribute('aria-invalid');
    }
  }

  if (incrementBtn) {
    if (isAtMax) {
      incrementBtn.classList.add('opacity-50', 'cursor-not-allowed');
      incrementBtn.setAttribute('disabled', 'true');
    } else {
      incrementBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      incrementBtn.removeAttribute('disabled');
    }
  }
}
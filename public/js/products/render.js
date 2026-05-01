import { escapeHtml } from '../utils/dom-utils.js';
import { getSelectedItems, getSelectedItemsArray, setQuantity, setDispatchUom, incrementQuantity, decrementQuantity, removeItem } from './state.js';

function getDefaultImage(firstTwo) {
  return `<div class="aspect-video bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium">${firstTwo}</div>`;
}

function getProductImage(product) {
  const firstTwo = (product.name || '').slice(0, 2).toUpperCase();
  if (product.image_path) {
    const imageUrl = `/cs-sacks-and-twines/public/uploads/products/${escapeHtml(product.image_path)}`;
    return `<img src="${imageUrl}" class="aspect-video object-none object-center" alt="" />`;
  }
  return getDefaultImage(firstTwo);
}

function getUnitToggle(product, selectedItem) {
  const category = product.category || '';
  const baseUom = product.base_uom || 'piece';
  const currentUom = selectedItem && typeof selectedItem === 'object' ? selectedItem.dispatch_uom : baseUom;

  if (category === 'sacks') {
    return `<input type="hidden" name="dispatch_uom" value="piece" data-dispatch-uom="${product.product_id}" />`;
  }

  if (category === 'twines') {
    const isRoll = currentUom === 'roll';
    const isKilo = currentUom === 'kilo';
    return `
      <div class="flex gap-1 w-full" data-unit-toggle="${product.product_id}">
        <button type="button" class="flex-1 btn${isRoll ? '-primary' : '-ghost'}" data-uom="roll">Roll</button>
        <button type="button" class="flex-1 btn${isKilo ? '-primary' : '-ghost'}" data-uom="kilo">Kg</button>
        <input type="hidden" name="dispatch_uom" value="${currentUom}" data-dispatch-uom="${product.product_id}" />
      </div>
    `;
  }

  return `<input type="hidden" name="dispatch_uom" value="${baseUom}" data-dispatch-uom="${product.product_id}" />`;
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
    <div class="card p-0 gap-0 justify-between" data-product-id="${product.product_id}" data-stock="${stock}" data-category="${product.category || ''}">
      <div>
        <section class="px-0 max-h-32 overflow-hidden">
          ${getProductImage(product)}
        </section>
        <header class="p-2 border-t">
          <h3 class="type-sm font-medium truncate">${escapeHtml(product.name || '')}</h3>
          <p class="type-xs text-muted-foreground">${escapeHtml(product.sku_code || '')}</p>
          <div class="flex w-full items-start justify-between">
            <span class="type-xs text-muted-foreground">${stock} ${baseUom}</span>
            <div class="flex items-start gap-2">
              ${isLowStock ? '<span class="badge-warning text-xs">Low</span>' : ''}
            </div>
          </div>
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
      <div class="col-span-full py-12 text-center">
        <p class="type-md text-muted-foreground">No products found</p>
        <p class="type-sm text-muted-foreground">Add products via stock-in to see them here.</p>
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
        ? `<img src="/cs-sacks-and-twines/public/uploads/products/${escapeHtml(item.image_path)}" class="size-10 object-cover rounded" alt="" />`
        : `<div class="size-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium">${firstTwo}</div>`;

      return `
        <div class="flex items-center gap-3 p-2 border rounded" data-product-id="${item.product_id}">
          ${imageHtml}
          <div class="flex-1 min-w-0">
            <p class="type-sm truncate">${escapeHtml(item.name || '')}</p>
            <p>${item.quantity}
              <span class="type-xs text-muted-foreground ml-1">${item.dispatch_uom}</span>
            </p>
          </div>
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
          btn.classList.toggle('btn-primary', isSelected);
          btn.classList.toggle('btn-ghost', !isSelected);
        });
        const hiddenInput = toggleContainer.querySelector('input[name="dispatch_uom"]');
        if (hiddenInput) {
          hiddenInput.value = newUom;
        }
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
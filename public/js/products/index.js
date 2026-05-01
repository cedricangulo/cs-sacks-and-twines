import { getProductsList } from './get-products.js';
import { setProducts } from './state.js';
import { renderProductsGrid, initProductCardHandlers, initQueueHandlers, renderDispatchQueue } from './render.js';
import { initDispatchButton } from './dispatch.js';

async function init() {
  const grid = document.getElementById('products-grid');
  if (!grid) {
    console.error('Products grid not found');
    return;
  }

  try {
    const products = await getProductsList();
    setProducts(products);
    grid.innerHTML = renderProductsGrid(products);
    initProductCardHandlers(grid);
    initQueueHandlers(document.getElementById('dispatch-queue'));
    initDispatchButton();
  } catch (error) {
    console.error('Failed to load products:', error);
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center">
        <p class="type-md text-destructive">Failed to load products</p>
        <p class="type-sm text-muted-foreground">Please try again later.</p>
      </div>
    `;
  }
}

init();
import { getDashboardStats } from './api.js';

/**
 * Formats a number as Philippine Peso currency.
 * @param {number} value - Numeric value to format
 * @returns {string} Formatted currency string (e.g., "₱12,500")
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str - Input string to escape
 * @returns {string} HTML-escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Initializes all dashboard stat cards by fetching and rendering data.
 * Populates the following cards:
 * - Total Asset Value (currency)
 * - Total Dispatch Value (currency)
 * - Manual Adjustments (count)
 * - Low Stock Products (list)
 * - Top Products This Month (ranked list)
 * - Today's Dispatches (count + value)
 * @returns {Promise<void>}
 */
export async function initStats() {
  const assetEl = document.getElementById('stat-asset-value');
  const dispatchEl = document.getElementById('stat-dispatch-value');
  const adjustEl = document.getElementById('stat-adjustments');
  const lowStockEl = document.getElementById('bi-low-stock');
  const topProductsEl = document.getElementById('bi-top-products');
  const todayDispatchesEl = document.getElementById('bi-today-dispatches');

  if (!assetEl && !dispatchEl && !adjustEl && !lowStockEl && !topProductsEl && !todayDispatchesEl) return;

  try {
    const response = await getDashboardStats();
    const stats = response.data;

    if (assetEl) {
      assetEl.textContent = formatCurrency(stats.asset_value);
    }
    if (dispatchEl) {
      dispatchEl.textContent = formatCurrency(stats.dispatch_value);
    }
    if (adjustEl) {
      adjustEl.textContent = `${stats.adjustments_today} Logs Today`;
    }
    if (lowStockEl) {
      if (stats.low_stock_products && stats.low_stock_products.length > 0) {
        lowStockEl.innerHTML = stats.low_stock_products.map(p => `
          <li class="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
            <span class="truncate">${escapeHtml(p.name)}</span>
            <span class="font-mono text-destructive">${Math.round(p.quantity)}</span>
          </li>
        `).join('');
      } else {
        lowStockEl.innerHTML = '<li class="text-muted-foreground">All stock levels OK</li>';
      }
    }
    if (topProductsEl) {
      if (stats.top_products && stats.top_products.length > 0) {
        topProductsEl.innerHTML = stats.top_products.map((p, i) => `
          <li class="flex justify-between items-center py-1">
            <span class="flex items-center gap-2">
              <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium">${i + 1}</span>
              <span class="truncate">${escapeHtml(p.name)}</span>
            </span>
            <span class="font-mono text-muted-foreground">${Math.round(p.quantity).toLocaleString()}</span>
          </li>
        `).join('');
      } else {
        topProductsEl.innerHTML = '<li class="text-muted-foreground">No dispatch data</li>';
      }
    }
    if (todayDispatchesEl) {
      const count = stats.today_dispatch_count ?? 0;
      const value = stats.today_dispatch_value ?? 0;
      todayDispatchesEl.innerHTML = count > 0 
        ? `${count} Order${count > 1 ? 's' : ''} <span class="text-muted-foreground text-sm block font-normal">${formatCurrency(value)}</span>`
        : 'No dispatches today';
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
    if (assetEl) assetEl.textContent = '—';
    if (dispatchEl) dispatchEl.textContent = '—';
    if (adjustEl) adjustEl.textContent = '—';
    if (lowStockEl) lowStockEl.innerHTML = '<li class="text-destructive">Failed to load</li>';
    if (topProductsEl) topProductsEl.innerHTML = '<li class="text-destructive">Failed to load</li>';
    if (todayDispatchesEl) todayDispatchesEl.textContent = '—';
  }
}
/**
 * Escape text for safe HTML output.
 *
 * @code UTIL-escapeHtml
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  const text = String(value ?? '');
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, (match) => map[match]);
}

/**
 * Render an empty-state using Basecoat UI patterns.
 *
 * @code UTIL-renderEmptyState
 * @param {'products' | 'users' | 'suppliers' | 'batches' | 'audit-logs' | 'dispatch-history' | 'error' | 'loading'} type
 * @param {string} [title]
 * @param {string} [description]
 * @returns {string}
 */
export function renderEmptyState(type, title, description) {
  const icons = {
    products: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
    users: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    suppliers: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-container-icon lucide-container"><path d="M22 7.7c0-.6-.4-1.2-.8-1.5l-6.3-3.9a1.72 1.72 0 0 0-1.7 0l-10.3 6c-.5.2-.9.8-.9 1.4v6.6c0 .5.4 1.2.8 1.5l6.3 3.9a1.72 1.72 0 0 0 1.7 0l10.3-6c.5-.3.9-1 .9-1.5Z"/><path d="M10 21.9V14L2.1 9.1"/><path d="m10 14 11.9-6.9"/><path d="M14 19.8v-8.1"/><path d="M18 17.5V9.4"/></svg>`,
    batches: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-boxes-icon lucide-boxes"><path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"/><path d="m7 16.5-4.74-2.85"/><path d="m7 16.5 5-3"/><path d="M7 16.5v5.17"/><path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"/><path d="m17 16.5-5-3"/><path d="m17 16.5 4.74-2.85"/><path d="M17 16.5v5.17"/><path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"/><path d="M12 8 7.26 5.15"/><path d="m12 8 4.74-2.85"/><path d="M12 13.5V8"/></svg>`,
    'audit-logs': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-logs-icon lucide-logs"><path d="M3 5h1"/><path d="M3 12h1"/><path d="M3 19h1"/><path d="M8 5h1"/><path d="M8 12h1"/><path d="M8 19h1"/><path d="M13 5h8"/><path d="M13 12h8"/><path d="M13 19h8"/></svg>`,
    'dispatch-history': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-history-icon lucide-history"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
    loading: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>`,
  };

  const defaults = {
    products: { title: 'No Products', description: 'Add your first product to start tracking inventory.', colspan: 9 },
    users: { title: 'No Staff', description: 'Add staff to manage your store operations.', colspan: 5 },
    suppliers: { title: 'No Suppliers', description: 'Add suppliers to create stock intake.', colspan: 5 },
    batches: { title: 'No Batches', description: 'Add batches to track your inventory.', colspan: 7 },
    'audit-logs': { title: 'No Audit Logs', description: 'Activity will appear here once actions are recorded.', colspan: 4 },
    'dispatch-history': { title: 'No Dispatches', description: 'Dispatches will appear here once created.', colspan: 5 },
    error: { title: 'Something went wrong', description: 'Please try again later.', colspan: 5 },
    loading: { title: 'Loading...', description: '', colspan: 5 },
  };

  const config = defaults[type] || {};
  const titleText = title || config.title;
  const descText = description !== undefined ? description : config.description;
  const iconHtml = icons[type] || icons.products;

  return `
    <tr>
      <td colspan="${config.colspan}">
        <div class="flex min-w-0 flex-1 flex-col items-center mx-auto justify-center gap-4 rounded-lg border-dashed p-8 text-center text-balance text-neutral-800">
          <header class="flex max-w-sm flex-col items-center gap-3 text-center">
            <div class="bg-muted text-foreground flex size-12 shrink-0 items-center justify-center rounded-lg">
              ${iconHtml}
            </div>
            <h3 class="text-lg font-medium tracking-tight">${escapeHtml(titleText)}</h3>
            ${descText ? `<p class="text-muted-foreground text-sm/relaxed">${escapeHtml(descText)}</p>` : ''}
          </header>
        </div>
      </td>
    </tr>
  `;
}

/**
 * @deprecated Use renderEmptyState() instead.
 * Render an empty-state table row.
 *
 * @code UTIL-renderEmptyRow
 * @param {{ colspan: number, message: string }} options
 * @returns {string}
 */
export function renderEmptyRow({ colspan, message }) {
  return `
    <tr>
      <td colspan="${colspan}" class="py-6 text-center type-sm text-muted-foreground">
        ${escapeHtml(message)}
      </td>
    </tr>
  `;
}

/**
 * Render a loading row with spinner for table bodies.
 *
 * @code UTIL-renderLoadingRow
 * @param {number} colspan - Number of columns to span
 * @param {string} [message] - Loading text
 * @returns {string}
 */
export function renderLoadingRow(colspan = 5, message = 'Loading...') {
  return `
    <tr>
      <td colspan="${colspan}" class="py-12">
        <div class="flex flex-col items-center justify-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="status" aria-label="Loading" class="size-6 animate-spin text-muted-foreground"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
          <span class="text-muted-foreground type-sm">${escapeHtml(message)}</span>
        </div>
      </td>
    </tr>
  `;
}

/**
 * Render a loading state for grid layouts.
 *
 * @code UTIL-renderLoadingGrid
 * @param {string} [message] - Loading text
 * @returns {string}
 */
export function renderLoadingGrid(message = 'Loading...') {
  return `
    <div class="col-span-full py-12">
      <div class="flex flex-col items-center justify-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" role="status" aria-label="Loading" class="size-6 animate-spin text-muted-foreground"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
        <span class="text-muted-foreground type-md">${escapeHtml(message)}</span>
      </div>
    </div>
  `;
}

/**
 * Get the application base path for constructing URLs.
 * Extracts the subfolder path from the current URL.
 *
 * @code UTIL-getBasePath
 * @returns {string} Base path (e.g., '/cs-sacks-and-twines' or '')
 */
export function getBasePath() {
  const pathname = window.location.pathname;
  // Remove the script filename or route segment to get base path
  // For /cs-sacks-and-twines/products, return /cs-sacks-and-twines
  // For /products, return ''
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 1) {
    return '';
  }
  // Remove the last segment (the current page/route)
  segments.pop();
  return '/' + segments.join('/');
}

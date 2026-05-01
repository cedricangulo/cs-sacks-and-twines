/**
 * Escape text for safe HTML output.
 *
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
 * @param {'products' | 'users' | 'suppliers' | 'error' | 'loading'} type
 * @param {string} [title]
 * @param {string} [description]
 * @returns {string}
 */
export function renderEmptyState(type, title, description) {
  const icons = {
    products: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
    users: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    suppliers: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 6h6"/><path d="M9 10h6"/><path d="M9 14h6"/><path d="M8 2v4"/><path d="M16 2v4"/></svg>`,
    error: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
    loading: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>`,
  };

  const defaults = {
    products: { title: 'No Products', description: 'Add your first product to start tracking inventory.', colspan: 9 },
    users: { title: 'No Staff', description: 'Add staff to manage your store operations.', colspan: 5 },
    suppliers: { title: 'No Suppliers', description: 'Add suppliers to create stock intake.', colspan: 5 },
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
        <div class="flex min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-lg border-dashed p-8 text-center text-balance text-neutral-800">
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

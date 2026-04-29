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

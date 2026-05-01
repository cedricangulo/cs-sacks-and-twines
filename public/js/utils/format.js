/**
 * @module format
 * Formatting utilities for the application.
 */

/**
 * Format a number as Philippine Peso currency.
 *
 * @param {string|number|null} value
 * @returns {string}
 */
export function formatCurrency(value) {
  const num = parseFloat(value) || 0;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
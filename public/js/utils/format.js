/**
 * @module format
 * Formatting utilities for the application.
 */

/**
 * Format a number as Philippine Peso currency.
 *
 * @code UTIL-formatCurrency
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

/**
 * Get initials from a name for image placeholders.
 *
 * @code UTIL-getInitials
 * @param {string} name
 * @returns {string}
 */
export function getInitials(name) {
  if (!name) return '';

  // Trim and split the name into words, then take the first character of the first two words
  const words = name.trim().split(/\s+/);

  // Take the first character of the first two words, convert to uppercase, and join them
  const initials = words.slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('');

  // If the name has only one word, use the first two characters of that word
  if (initials.length === 1 && words[0].length > 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return initials;
}

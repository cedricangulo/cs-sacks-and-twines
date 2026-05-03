/**
 * @module toast
 * Toast notification utilities using Basecoat UI.
 */

/**
 * Dispatch a Basecoat toast event.
 *
 * @code UTIL-showToast
 * @param {string} category
 * @param {string} title
 * @param {string} description
 */
export function showToast(category, title, description) {
  document.dispatchEvent(new CustomEvent('basecoat:toast', {
    detail: {
      config: { category, title, description, cancel: { label: 'Dismiss' } }
    }
  }));
}

/**
 * Toast helper API.
 *
 * @code UTIL-toast
 */
export const toast = {
  success: (title, desc) => showToast('success', title, desc),
  error: (title, desc) => showToast('error', title, desc),
};

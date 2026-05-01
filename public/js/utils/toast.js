/**
 * @module toast
 * Toast notification utilities using Basecoat UI.
 */

export function showToast(category, title, description) {
  document.dispatchEvent(new CustomEvent('basecoat:toast', {
    detail: {
      config: { category, title, description, cancel: { label: 'Dismiss' } }
    }
  }));
}

export const toast = {
  success: (title, desc) => showToast('success', title, desc),
  error: (title, desc) => showToast('error', title, desc),
};
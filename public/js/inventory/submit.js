import {
  clearDialogError,
  resetForm,
  setSubmittingState,
  showDialogError,
  validateBeforeSubmit,
} from './state.js';

export function initInventorySubmission(state) {
  state.form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!validateBeforeSubmit(state)) {
      return;
    }

    setSubmittingState(state, true);
    clearDialogError(state);

    try {
      const response = await fetch(state.submitUrl, {
        method: 'POST',
        body: new FormData(state.form),
        credentials: 'same-origin',
        headers: {
          'X-Requested-With': 'fetch',
        },
      });

      const payload = await response.json().catch(() => null);
      const message = payload && typeof payload.message === 'string'
        ? payload.message
        : 'Unable to save inventory right now. Please try again.';

      if (!response.ok || !payload || payload.success !== true) {
        showDialogError(state, message);
        return;
      }

      state.dialog.close();
      resetForm(state);
    } catch {
      showDialogError(state, 'Unable to save inventory right now. Please try again.');
    } finally {
      setSubmittingState(state, false);
    }
  });
}
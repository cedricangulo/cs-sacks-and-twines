# Forms: Field Migration + Validation Pattern

This project uses Basecoat's field structure with per-field errors and a single general error alert. Use this pattern for all new forms except sign-in (keep sign-in generic to avoid leaking which input failed).

## Required HTML Structure

### General form shell

```html
<form class="form" method="POST" novalidate>
  <div class="hidden px-4 py-3 text-sm text-red-700 border border-red-200 bg-red-50" role="alert" data-form-error></div>

  <fieldset class="fieldset">
    <legend>Section title</legend>
    <p>Section description.</p>

    <div class="grid gap-4">
      <!-- Field blocks go here -->
    </div>
  </fieldset>

  <button type="submit" class="btn">Save</button>
</form>
```

### Field block (Basecoat)

```html
<div role="group" class="field" data-field="company_name">
  <label for="company_name">Company Name</label>
  <input
    id="company_name"
    name="company_name"
    class="input"
    data-field-input="company_name"
    aria-describedby="company_name-error"
    required
  />
  <p
    id="company_name-error"
    class="hidden text-sm text-destructive"
    role="alert"
    data-field-error="company_name">
  </p>
</div>
```

### Field error rules

- Add `data-invalid` to the `.field` wrapper when invalid.
- Add `aria-invalid="true"` to the input/select/textarea.
- Use `data-field-error` for the error message slot.
- Keep `data-form-error` for non-field errors (server error, unexpected failure).

## JS Behavior (submit-only + clear-on-input)

### Error helpers

```js
const setFieldError = (fieldName, message) => {
  const field = form.querySelector(`[data-field="${fieldName}"]`);
  const input = form.querySelector(`[data-field-input="${fieldName}"]`);
  const error = form.querySelector(`[data-field-error="${fieldName}"]`);

  if (!field || !input || !error) return;

  field.setAttribute('data-invalid', 'true');
  input.setAttribute('aria-invalid', 'true');
  error.textContent = message;
  error.classList.remove('hidden');
};

const clearFieldError = (fieldName) => {
  const field = form.querySelector(`[data-field="${fieldName}"]`);
  const input = form.querySelector(`[data-field-input="${fieldName}"]`);
  const error = form.querySelector(`[data-field-error="${fieldName}"]`);

  if (!field || !input || !error) return;

  field.removeAttribute('data-invalid');
  input.removeAttribute('aria-invalid');
  error.textContent = '';
  error.classList.add('hidden');
};
```

### Submit flow

```js
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideGeneralError();
  clearAllFieldErrors();

  const errors = validate(); // returns { fieldName: message }
  if (Object.keys(errors).length > 0) {
    Object.entries(errors).forEach(([field, message]) => setFieldError(field, message));
    focusFirstInvalidField();
    return;
  }

  // submit
});

// Clear error when the user edits a field
input.addEventListener('input', () => clearFieldError('company_name'));
```

### Server error handling

```js
if (response?.errors) {
  Object.entries(response.errors).forEach(([field, message]) => {
    if (typeof message === 'string') setFieldError(field, message);
  });
  focusFirstInvalidField();
  return;
}

showGeneralError(response?.message || 'Unexpected error.');
```

## PHP Response Shape

### Validation errors

```php
$this->jsonResponse([
  'success' => false,
  'errors' => [
    'company_name' => 'Enter a valid company name.',
    'contact_number' => 'Enter a valid contact number.',
  ],
], 422);
```

### General error

```php
$this->jsonResponse([
  'success' => false,
  'message' => 'Unable to save right now. Please try again.',
], 500);
```

## Special cases

- **Sign-in**: keep a single general error message (do not show field-level errors).
- **Combobox fields**: attach `data-field-input` to the trigger button so field errors can be applied consistently, and render the error below the trigger.

## Existing Examples

- Suppliers form: `app/views/pages/suppliers/add-supplier-dialog.php`
- Inventory form: `app/views/pages/inventory/add-inventory-dialog.php`

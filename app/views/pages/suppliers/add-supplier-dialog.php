<?php
require_once __DIR__ . '/../../../core/sanitize.php';
?>

<dialog id="add-supplier-dialog" class="w-full dialog sm:max-w-5xl max-h-164" aria-labelledby="add-supplier-dialog-title" aria-describedby="add-supplier-dialog-description" data-supplier-dialog onclick="if (event.target === this) this.close()">
  <div>
    <header>
      <h2 id="add-supplier-dialog-title">Add Supplier</h2>
      <p id="add-supplier-dialog-description">Fill in the details for the new supplier.</p>
    </header>

    <section class="overflow-y-auto scrollbar">
      <form id="suppliers-form" class="form pb-4" data-suppliers-form action="<?= escape_for_html(routeUrl('/api/suppliers/save')) ?>" method="POST" novalidate>
        <div class="hidden px-4 py-3 text-sm text-red-700 border border-red-200 bg-red-50" role="alert" data-form-error></div>
        <fieldset class="fieldset">
          <div class="grid gap-4">
            <div role="group" class="field" data-field="company_name">
              <label for="company_name">Company Name</label>
              <input class="input" type="text" name="company_name" id="company_name" required maxlength="255" minlength="2" placeholder="Acme Corporation" data-field-input="company_name" aria-describedby="company_name-error">
              <p id="company_name-error" class="hidden text-sm text-destructive" role="alert" data-field-error="company_name"></p>
            </div>

            <div role="group" class="field" data-field="contact_person">
              <label for="contact_person">Contact Person</label>
              <input class="input" type="text" name="contact_person" id="contact_person" required maxlength="255" minlength="2" placeholder="John Doe" data-field-input="contact_person" aria-describedby="contact_person-error">
              <p id="contact_person-error" class="hidden text-sm text-destructive" role="alert" data-field-error="contact_person"></p>
            </div>

            <div role="group" class="field" data-field="contact_number">
              <label for="contact_number">Contact Number</label>
              <input class="input" type="tel" name="contact_number" id="contact_number" required maxlength="20" minlength="10" placeholder="+63 912 345 6789 or 0912 345 6789" pattern="[0-9+() \-]{7,20}" data-field-input="contact_number" aria-describedby="contact_number-error">
              <p id="contact_number-error" class="hidden text-sm text-destructive" role="alert" data-field-error="contact_number"></p>
            </div>

            <div role="group" class="field" data-field="address">
              <label for="address">Address</label>
              <textarea class="input" name="address" id="address" required maxlength="500" minlength="10" placeholder="123 Main St, Cabanatuan City, Nueva Ecija" data-field-input="address" aria-describedby="address-error"></textarea>
              <p id="address-error" class="hidden text-sm text-destructive" role="alert" data-field-error="address"></p>
            </div>
          </div>
        </fieldset>
      </form>
    </section>

    <footer>
      <button class="btn-outline" type="button" onclick="this.closest('dialog').close()">Cancel</button>
      <button class="btn" type="submit" form="suppliers-form" data-save-button>Save supplier</button>
    </footer>

    <button type="button" aria-label="Close dialog" onclick="this.closest('dialog').close()">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </button>
  </div>
</dialog>

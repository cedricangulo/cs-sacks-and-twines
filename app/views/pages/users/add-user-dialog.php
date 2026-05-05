<?php
require_once __DIR__ . '/../../../core/sanitize.php';
?>

<dialog id="add-user-dialog" class="w-full dialog sm:max-w-5xl max-h-164" aria-labelledby="add-user-dialog-title" aria-describedby="add-user-dialog-description" data-user-dialog onclick="if (event.target === this) this.close()">
  <div>
    <header>
      <h2 id="add-user-dialog-title">Add staff</h2>
      <p id="add-user-dialog-description">Fill in the details for the new staff member.</p>
    </header>

    <section class="overflow-y-auto scrollbar">
      <form id="users-form" class="form pb-4" data-users-form action="<?= escape_for_html(routeUrl('/api/users/save')) ?>" method="POST" novalidate>
        <div class="hidden px-4 py-3 text-sm text-red-700 border border-red-200 bg-red-50" role="alert" data-form-error></div>
        <fieldset class="fieldset">
          <div class="grid gap-4">
            <div role="group" class="field" data-field="name">
              <label for="user-name">Full Name</label>
              <input class="input" type="text" name="name" id="user-name" required maxlength="255" minlength="2" placeholder="Jane Doe" data-field-input="name" aria-describedby="user-name-error">
              <p id="user-name-error" class="hidden text-sm text-destructive" role="alert" data-field-error="name"></p>
            </div>

            <div role="group" class="field" data-field="email">
              <label for="user-email">Email Address</label>
              <input class="input" type="email" name="email" id="user-email" required maxlength="254" placeholder="jane@example.com" data-field-input="email" aria-describedby="user-email-error">
              <p id="user-email-error" class="hidden text-sm text-destructive" role="alert" data-field-error="email"></p>
            </div>

            <div role="group" class="field" data-field="password">
              <label for="user-password">Password</label>
              <input class="input" type="password" name="password" id="user-password" required minlength="8" placeholder="At least 8 characters" data-field-input="password" aria-describedby="user-password-error">
              <p id="user-password-error" class="hidden text-sm text-destructive" role="alert" data-field-error="password"></p>
            </div>
          </div>
        </fieldset>
      </form>
    </section>

    <footer>
      <button class="btn-outline" type="button" onclick="this.closest('dialog').close()">Cancel</button>
      <button class="btn" type="submit" form="users-form" data-save-button>Save staff</button>
    </footer>

    <button type="button" aria-label="Close dialog" onclick="this.closest('dialog').close()">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </button>
  </div>
</dialog>

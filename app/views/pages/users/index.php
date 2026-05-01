<?php
include __DIR__ . '/add-user-dialog.php';
?>

<dialog id="confirm-deactivate-dialog" class="w-full dialog sm:max-w-md">
  <div class="max-w-md">
    <header>
      <h2>Deactivate Staff</h2>
      <p id="deactivate-staff-name" class="text-muted-foreground"></p>
    </header>
    <section class="py-4">
      <p>Are you sure you want to deactivate this staff member? They will no longer be able to sign in.</p>
    </section>
    <footer>
      <button class="btn-outline" type="button" onclick="this.closest('dialog').close()">Cancel</button>
      <button class="btn text-white bg-destructive hover:bg-destructive-strong" type="button" data-confirm-deactivate>Deactivate</button>
    </footer>
    <button type="button" aria-label="Close dialog" onclick="this.closest('dialog').close()">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </button>
  </div>
</dialog>

<section class="p-6 pt-23">
  <div class="flex w-full items-center justify-between gap-4">
    <div class="space-y-2">
      <h2 class="type-lg">Staff</h2>
      <p class="type-sm text-muted-foreground">
        Add or deactivate staff accounts.
      </p>
    </div>

    <button
      type="button"
      class="btn"
      onclick="document.getElementById('add-user-dialog').showModal()">
      Add Staff
    </button>
  </div>

  <div class="mt-6">
    <table class="table">
      <thead>
        <tr class="text-muted-foreground/70">
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Added At</th>
          <th class="text-right">Actions</th>
        </tr>
      </thead>
      <tbody id="users-container" data-api-url="<?= htmlspecialchars(routeUrl('/api/users'), ENT_QUOTES, 'UTF-8') ?>" data-deactivate-url="<?= htmlspecialchars(routeUrl('/api/users/deactivate'), ENT_QUOTES, 'UTF-8') ?>">
      </tbody>
    </table>
  </div>
</section>

<script type="module" src="<?= htmlspecialchars(routeUrl('/public/dist/users/index.js'), ENT_QUOTES, 'UTF-8') ?>"></script>

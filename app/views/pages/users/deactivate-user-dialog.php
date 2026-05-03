<dialog id="confirm-deactivate-dialog" class="w-full dialog sm:max-w-md" aria-labelledby="deactivate-user-title" aria-describedby="deactivate-user-description" data-deactivate-user-dialog onclick="if (event.target === this) this.close()">
  <div class="max-w-md">
    <header>
      <h2 id="deactivate-user-title">Deactivate Staff</h2>
      <p id="deactivate-user-description"></p>
    </header>
    <section class="py-4">
      <p>Are you sure you want to deactivate this staff member? They will no longer be able to sign in.</p>
    </section>
    <footer>
      <button class="btn-outline" type="button" onclick="this.closest('dialog').close()">Cancel</button>
      <button class="btn-destructive" type="button" data-confirm-deactivate>Deactivate</button>
    </footer>
    <button type="button" aria-label="Close dialog" onclick="this.closest('dialog').close()">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-icon lucide-x">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </button>
  </div>
</dialog>
<?php
// Cashiers only see their own audit trail and get a route back to Products.
?>
<section class="p-6 space-y-6 pt-23 h-fit">
  <a class="block w-fit" href="<?= routeUrl('/products') ?>">
    <button class="btn-ghost">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left-icon lucide-arrow-left">
        <path d="m12 19-7-7 7-7" />
        <path d="M19 12H5" />
      </svg>
      Back
    </button>
  </a>
  <h2 class="type-lg">Personal audit logs</h2>
</section>
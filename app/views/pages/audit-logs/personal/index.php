<?php
$escape = static fn($value) => htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
$routeUrl = static fn($path) => call_user_func('routeUrl', $path);
?>
<section class="p-6 pt-17 space-y-6">
  <a class="block w-fit" href="<?= $escape($routeUrl('/products')) ?>">
    <button class="btn-ghost">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left-icon lucide-arrow-left">
        <path d="m12 19-7-7 7-7" />
        <path d="M19 12H5" />
      </svg>
      Back
    </button>
  </a>

  <div class="space-y-2">
    <h2 class="type-lg">Personal audit logs</h2>
    <p class="type-sm text-muted-foreground">
      Your activity history.
    </p>
  </div>

  <div class="overflow-x-auto">
    <table class="table">
      <thead>
        <tr>
          <th>Date/Time</th>
          <th>Action</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody id="audit-logs-container" data-api-url="<?= $escape($routeUrl('/api/audit-logs/personal')) ?>">
        <tr>
          <td colspan="3" class="py-8 text-center text-muted-foreground">
            Loading audit logs...
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div id="pagination-container" class="mt-6"></div>
</section>

<script type="module" src="<?= $escape($routeUrl('/public/dist/audit-logs/index.js')) ?>"></script>
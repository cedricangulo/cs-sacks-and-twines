<section class="p-6 pt-23">
  <div class="flex w-full items-center justify-between gap-4 mb-6">
    <div class="space-y-2">
      <h2 class="type-lg">Audit logs</h2>
      <p class="type-sm text-muted-foreground">
        View all system activity history.
      </p>
    </div>
  </div>

  <div class="overflow-x-auto">
    <table class="table">
      <thead>
        <tr>
          <th>Date/Time</th>
          <th>User</th>
          <th>Action</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody id="audit-logs-container" data-api-url="<?= htmlspecialchars(routeUrl('/api/audit-logs'), ENT_QUOTES, 'UTF-8') ?>">
        <tr>
          <td colspan="4" class="py-8 text-center text-muted-foreground">
            Loading audit logs...
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div id="pagination-container" class="mt-6"></div>
</section>

<script type="module" src="<?= htmlspecialchars(routeUrl('/public/dist/audit-logs/index.js'), ENT_QUOTES, 'UTF-8') ?>"></script>
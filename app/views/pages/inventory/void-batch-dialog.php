<?php
require_once __DIR__ . '/../../../core/sanitize.php';
?>

<dialog id="void-batch-dialog" class="w-full dialog sm:max-w-2xl" aria-labelledby="void-batch-dialog-title" aria-describedby="void-batch-dialog-description" data-void-batch-dialog onclick="if (event.target === this) this.close()">
  <div class="max-w-2xl">
    <header>
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-1.5">
          <h2 id="void-batch-dialog-title" class="font-semibold type-lg text-foreground">Void Batch</h2>
          <p id="void-batch-dialog-description" class="type-sm text-muted-foreground">Confirm this batch reversal and review the affected records before continuing.</p>
        </div>
        <button type="button" aria-label="Close dialog" class="-mt-1 -mr-1 btn-icon-ghost" data-void-close-button>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </header>

    <section class="overflow-y-auto scrollbar">
      <form id="void-batch-form" class="pb-4 form" data-void-batch-form action="<?= escape_for_html(routeUrl('/api/inventory/batches/void')) ?>" method="POST" novalidate>
        <input type="hidden" name="batch_id" value="" data-void-batch-id />

        <div class="hidden px-4 py-3 mb-6 type-sm text-red-700 border border-red-200 bg-red-50 rounded-base" role="alert" data-void-form-error></div>

        <div class="space-y-6">
          <div class="gap-2 p-4 shadow-none card">
            <h3 class="font-medium type-base text-foreground">Batch details</h3>

            <dl class="grid gap-2">
              <div class="flex items-center justify-between">
                <dt class="type-sm text-muted-foreground">Batch code</dt>
                <dd class="font-medium type-sm text-foreground" data-void-batch-code>-</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="type-sm text-muted-foreground">Product</dt>
                <dd class="type-sm font-medium text-foreground text-right max-w-[60%]" data-void-product-name>-</dd>
              </div>
              <div class="flex items-center justify-between pt-2 mt-2 border-t border-border">
                <dt class="type-sm text-muted-foreground">Quantity remaining</dt>
                <dd class="font-semibold type-sm text-foreground" data-void-quantity-remaining>-</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="type-sm text-muted-foreground">Procurement cost</dt>
                <dd class="font-medium type-sm text-foreground" data-void-procurement-cost>-</dd>
              </div>
            </dl>
          </div>

          <div class="gap-2 p-4 shadow-none card border-destructive bg-destructive/10">
            <div class="flex items-center gap-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-destructive shrink-0">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
              <h3 class="font-medium type-base text-foreground">This action will affect:</h3>
            </div>
            <ul class="space-y-2 type-sm">
              <li class="flex gap-2">
                <span class="mt-1.5 size-1.5 rounded-xl bg-destructive shrink-0"></span>
                <span class="text-foreground">Product quantity will decrease by <span class="font-medium" data-void-product-delta>0</span></span>
              </li>
              <li class="flex gap-2">
                <span class="mt-1.5 size-1.5 rounded-xl bg-destructive shrink-0"></span>
                <span class="text-foreground">Product asset value will decrease by <span class="font-medium" data-void-asset-delta>0.00</span></span>
              </li>
              <li class="flex gap-2">
                <span class="mt-1.5 size-1.5 rounded-xl bg-destructive shrink-0"></span>
                <span class="text-foreground">Pending stock adjustments will be voided automatically</span>
              </li>
            </ul>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="label" for="void-batch-reason">Reason for voiding</label>
              <span class="type-xs text-muted-foreground">Optional</span>
            </div>
            <textarea id="void-batch-reason" name="reason" rows="3" class="w-full resize-none textarea" placeholder="E.g., Received damaged items, duplicate entry, wrong supplier..." data-field-input="reason"></textarea>
            <p class="text-center type-xs text-muted-foreground">This note will be recorded in the audit log for traceability.</p>
          </div>
        </div>
      </form>
    </section>

    <footer>
      <div class="flex items-center justify-end gap-3">
        <button class="btn-outline" type="button" data-void-cancel-button>Cancel</button>
        <button class="btn-destructive" type="submit" form="void-batch-form" data-void-confirm-button>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          Void batch
        </button>
      </div>
    </footer>
  </div>
</dialog>
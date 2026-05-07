<?php

// Timezone
date_default_timezone_set('Asia/Manila');

// Get current hour (0-23)
$hour = date('G');

if ($hour >= 5 && $hour < 12) {
  $greeting = "Morning";
} elseif ($hour >= 12 && $hour < 18) {
  $greeting = "Afternoon";
} else {
  $greeting = "Evening";
}

?>

<section class="p-6 pt-23 space-y-6">
  <h2 class="type-lg">Good <?= $greeting; ?>, <?= $_SESSION['user']['name']; ?></h2>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="card">
      <header class="text-muted-foreground">Total Asset Value</header>
      <section>
        <h4 id="stat-asset-value" class="type-lg font-mono">
          <span class="text-muted-foreground text-sm">Loading...</span>
        </h4>
      </section>
    </div>
    <div class="card">
      <header class="text-muted-foreground">Total Dispatch Value</header>
      <section>
        <h4 id="stat-dispatch-value" class="type-lg font-mono">
          <span class="text-muted-foreground text-sm">Loading...</span>
        </h4>
      </section>
    </div>
    <div class="card">
      <header class="text-muted-foreground">Manual Adjustments</header>
      <section>
        <h4 id="stat-adjustments" class="type-lg font-mono">
          <span class="text-muted-foreground text-sm">Loading...</span>
        </h4>
      </section>
    </div>
  </div>

  <!-- Charts -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="card">
      <header>
        <p class="type-base text-muted-foreground">Stocks Efficiency Rate</p>
      </header>
      <section class="h-64 max-w-[70%] mx-auto">
        <canvas id="efficiency-gauge"></canvas>
      </section>
    </div>
    <div class="card">
      <header class="flex items-center justify-between">
        <p class="type-base text-muted-foreground">Product Dispatch History</p>
        <select id="dispatch-range" class="select">
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month" selected>This Month</option>
          <option value="3months">3 Months</option>
          <option value="year">This Year</option>
        </select>
      </header>
      <section class="h-64">
        <canvas id="dispatch-chart"></canvas>
      </section>
    </div>
  </div>

  <!-- Business Intelligence -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="card">
      <header class="text-muted-foreground">Low Stock Items</header>
      <section>
        <ul id="bi-low-stock" class="type-sm space-y-1 max-h-48 overflow-y-auto">
          <li class="text-muted-foreground">Loading...</li>
        </ul>
      </section>
    </div>
    <div class="card">
      <header class="text-muted-foreground">Top Products (This Month)</header>
      <section>
        <ol id="bi-top-products" class="type-sm space-y-1">
          <li class="text-muted-foreground">Loading...</li>
        </ol>
      </section>
    </div>
    <div class="card">
      <header class="text-muted-foreground">Today's Dispatches</header>
      <section>
        <h4 id="bi-today-dispatches" class="type-lg font-mono">
          <span class="text-muted-foreground text-sm">Loading...</span>
        </h4>
      </section>
    </div>
  </div>
</section>

<script type="module" src="<?= routeUrl('/dist/dashboard/index.js') ?>"></script>
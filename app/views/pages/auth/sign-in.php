<?php
// The sign-in page keeps the form simple and focused: email, password, error
// feedback, and a single submit action.
?>
<section class="flex h-screen">
  <div class="w-full p-8 max-w-2/4 bg-linear-to-t from-primary to-primary/80">
    <h1 class="type-xl text-white">Sacks and Twines</h1>
  </div>
  <div class="grid w-full max-w-2/4 place-items-center">
    <!-- The action stays on the route itself so the controller can intercept POST requests. -->
    <form class="mx-auto w-96 space-y-6" action="<?= htmlspecialchars(routeUrl('/sign-in'), ENT_QUOTES, 'UTF-8') ?>" method="post" autocomplete="off">
      <div class="space-y-2">
        <p class="type-base text-muted-foreground">Welcome back</p>
        <h2 class="font-semibold type-lg">Sign in</h2>
      </div>

      <!-- Show one generic message for validation and authentication errors. -->
      <?php if (!empty($signInError ?? '')): ?>
        <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <?= htmlspecialchars((string) ($signInError ?? ''), ENT_QUOTES, 'UTF-8') ?>
        </div>
      <?php endif; ?>

      <div class="space-y-2">
        <label class="label text-muted-foreground" for="email">Email</label>
        <input class="w-full input" id="email" type="email" name="email" placeholder="you@example.com" value="<?= htmlspecialchars((string) ($signInEmail ?? ''), ENT_QUOTES, 'UTF-8') ?>" required>
      </div>

      <div class="space-y-2">
        <label class="label text-muted-foreground" for="password">Password</label>
        <input class="w-full input" id="password" type="password" name="password" placeholder="••••••••" autocomplete="current-password" required>
      </div>

      <button class="justify-center w-full btn" type="submit">Sign in</button>
    </form>
  </div>
</section>
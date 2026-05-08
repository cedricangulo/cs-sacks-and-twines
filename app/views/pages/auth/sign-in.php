<section class="flex gap-4 h-screen p-4">
  <div class="hidden md:block relative overflow-hidden w-full max-w-2/4 rounded-(--radius) bg-cover bg-center" style="background-image: url('<?= escape_for_html(routeUrl('/public/images/sacks-and-twines.jpg')) ?>');">
    <div class="absolute bottom-0 left-0 w-full h-2/4 bg-linear-to-t from-primary/80 to-primary/0"></div>
    <h1 class="absolute text-white bottom-4 left-4 type-xl">Sacks and Twines</h1>
  </div>
  <div class="grid w-full md:max-w-2/4 place-items-center">
    <!-- The action stays on the route itself so the controller can intercept POST requests. -->
    <form class="mx-auto space-y-6 w-full md:max-w-96" action="<?= escape_for_html(routeUrl('/sign-in')) ?>" method="post" autocomplete="off">
      <div class="space-y-2">
        <p class="type-base text-muted-foreground">Welcome back</p>
        <h2 class="font-semibold type-lg">Sign in</h2>
      </div>

      <!-- Show one generic message for validation and authentication errors. -->
      <?php if (!empty($signInError ?? '')): ?>
        <div class="rounded-(--radius) px-4 py-3 text-sm text-destructive-foreground border border-red-500 bg-destructive">
          <?= escape_for_html((string) ($signInError ?? '')) ?>
        </div>
      <?php endif; ?>

      <div class="space-y-2">
        <label class="label text-muted-foreground" for="email">Email</label>
        <input class="w-full input" id="email" type="email" name="email" placeholder="you@example.com" value="<?= escape_for_html((string) ($signInEmail ?? '')) ?>" required>
      </div>

      <div class="space-y-2">
        <label class="label text-muted-foreground" for="password">Password</label>
        <input class="w-full input" id="password" type="password" name="password" placeholder="••••••••" autocomplete="current-password" required>
      </div>

      <button class="justify-center w-full btn" type="submit">Sign in</button>
    </form>
  </div>
</section>
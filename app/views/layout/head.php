<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- Title comes from the route metadata so every page can define its own label. -->
  <title><?php echo htmlspecialchars((string) ($pageTitle ?? 'Sacks and Twines'), ENT_QUOTES, 'UTF-8'); ?></title>

  <!-- Basecoat local CDN -->
  <link rel="stylesheet" href="<?php echo routeUrl('/public/css/basecoat.cdn.min.css'); ?>">
  <script src="<?php echo routeUrl('/public/js/basecoat.cdn.min.js'); ?>" defer></script>
  <script src="<?php echo routeUrl('/public/js/toast.min.js'); ?>" defer></script>
  <script src="<?php echo routeUrl('/public/js/security-deterrents.js'); ?>" defer></script>

  <!-- Custom Styles -->
  <link rel="stylesheet" href="<?php echo routeUrl('/public/css/output.css'); ?>">

<!-- Live Reload (dev only) -->
  <script>
    if (location.hostname === 'localhost') {
      let lastTimestamp = null;

      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch('<?php echo routeUrl('/public/dist/latest.json'); ?>?v=' + Date.now());

          if (!response.ok) throw new Error('Watcher stopped');

          const data = await response.json();

          if (lastTimestamp && data.t !== lastTimestamp) {
            location.reload();
          }
          lastTimestamp = data.t;
        } catch (e) {
          console.log('Watcher offline. Stopping poll.');
          clearInterval(pollInterval);
        }
      }, 1000);
    }
  </script>

  <!-- Theme Mode Script -->
  <script>
    (() => {
      try {
        const stored = localStorage.getItem('themeMode');
        if (stored ? stored === 'dark' :
          matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        }
      } catch (_) {}

      const apply = dark => {
        document.documentElement.classList.toggle('dark', dark);
        try {
          localStorage.setItem('themeMode', dark ? 'dark' : 'light');
        } catch (_) {}
      };

      document.addEventListener('basecoat:theme', (event) => {
        const mode = event.detail?.mode;
        apply(mode === 'dark' ? true :
          mode === 'light' ? false :
          !document.documentElement.classList.contains('dark'));
      });
    })();
  </script>
</head>
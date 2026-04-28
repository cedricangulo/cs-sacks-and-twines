<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?php echo htmlspecialchars((string) ($pageTitle ?? 'Sacks and Twines'), ENT_QUOTES, 'UTF-8'); ?></title>

  <!-- Basecoat local CDN -->
  <link rel="stylesheet" href="<?php echo routeUrl('/public/css/basecoat.cdn.min.css'); ?>">
  <script src="<?php echo routeUrl('/public/js/basecoat.cdn.min.js'); ?>" defer></script>

  <!-- Custom Styles -->
  <link rel="stylesheet" href="<?php echo routeUrl('/public/css/output.css'); ?>">
</head>
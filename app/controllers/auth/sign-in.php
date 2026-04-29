<?php

// This controller handles the sign-in request before the view is rendered so
// the route can support both GET display and POST authentication.
require_once __DIR__ . '/../../core/db.php';
require_once __DIR__ . '/../../models/Auth.php';

$signInError = $signInError ?? null;
$signInEmail = $signInEmail ?? '';

// If a user already has a session role, send them straight into the app.
$currentUserRole = $_SESSION['user']['role'] ?? $_SESSION['user_role'] ?? null;

if (is_string($currentUserRole) && $currentUserRole !== '') {
  $redirectPath = $currentUserRole === 'cashier' ? '/products' : '/dashboard';
  header('Location: ' . routeUrl($redirectPath));
  exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
  // GET requests just render the form.
  return;
}

// Normalize the submitted form data before validation.
$signInEmail = trim((string) ($_POST['email'] ?? ''));
$signInPassword = (string) ($_POST['password'] ?? '');

if ($signInEmail === '' || $signInPassword === '') {
  $signInError = 'Enter your email and password.';
  return;
}

if (!filter_var($signInEmail, FILTER_VALIDATE_EMAIL)) {
  $signInError = 'Enter a valid email address.';
  return;
}

try {
  // The auth model owns the lookup and password verification.
  $auth = new Auth(app_db());
  $user = $auth->attemptSignIn(mb_strtolower($signInEmail), $signInPassword);

  if ($user === null) {
    $signInError = 'Invalid email or password.';
    return;
  }

  // Regenerate the session ID after login to reduce fixation risk.
  session_regenerate_id(true);

  $_SESSION['user'] = [
    'id' => (int) $user['id'],
    'name' => (string) $user['name'],
    'email' => (string) $user['email'],
    'role' => (string) $user['role'],
  ];
  $_SESSION['user_role'] = (string) $user['role'];

  // Route users to the correct landing page for their role.
  $redirectPath = $user['role'] === 'cashier' ? '/products' : '/dashboard';
  header('Location: ' . routeUrl($redirectPath));
  exit;
} catch (Throwable $throwable) {
  // Hide the underlying exception from the user to avoid leaking runtime details.
  $signInError = 'Unable to sign in right now. Please try again.';
}
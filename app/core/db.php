<?php

if (!function_exists('app_db')) {
  function app_db(): PDO
  {
    // Cache the PDO instance so the app reuses one connection per request.
    static $pdo = null;

    if ($pdo instanceof PDO) {
      return $pdo;
    }

    // Prefer a fully defined DSN when one is provided by the environment.
    $dsn = getenv('DB_DSN') ?: '';

    if ($dsn === '') {
      // Fall back to the common local XAMPP-style settings when no DSN exists.
      $host = getenv('DB_HOST') ?: 'localhost';
      $port = getenv('DB_PORT') ?: '3306';
      $database = getenv('DB_NAME') ?: 'sacks_and_twines_inventory';
      $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $database);
    }

    // Use the conventional root account defaults unless the environment says otherwise.
    $username = getenv('DB_USER') ?: getenv('DB_USERNAME') ?: 'root';
    $password = getenv('DB_PASSWORD') ?: '';

    // Enable exceptions and associative fetches so model code stays small and
    // failures surface immediately during development.
    $pdo = new PDO($dsn, $username, $password, [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
  }
}

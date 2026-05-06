<?php

declare(strict_types=1);

// Start the session once for the whole request lifecycle so authentication
// and route helpers can read and write role state safely.
if (session_status() === PHP_SESSION_NONE) {
	// Set session cookie security flags to prevent session hijacking
	session_set_cookie_params([
		'httponly' => true,
		'secure' => true,
		'samesite' => 'Strict',
	]);
	ini_set('session.use_only_cookies', '1');
	session_start();
}

// Core helpers are loaded globally because every page depends on path and
// route resolution.
require_once __DIR__ . '/path.php';
require_once __DIR__ . '/routes.php';
require_once __DIR__ . '/page.php';
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/QueryFilter.php';
<?php

// Start the session once for the whole request lifecycle so authentication
// and route helpers can read and write role state safely.
if (session_status() === PHP_SESSION_NONE) {
	session_start();
}

// Core helpers are loaded globally because every page depends on path and
// route resolution.
require_once __DIR__ . '/path.php';
require_once __DIR__ . '/routes.php';
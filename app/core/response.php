<?php

declare(strict_types=1);

/**
 * Send a JSON response and stop script execution.
 *
 * @param array<string, mixed> $payload
 * @param int $statusCode
 * @return void
 */
if (!function_exists('app_json_response')) {
	function app_json_response(array $payload, int $statusCode): void
	{
		header('Content-Type: application/json; charset=UTF-8');
		http_response_code($statusCode);
		echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}';
		exit;
	}
}
<?php

declare(strict_types=1);

/**
 * Return the application base path for subfolder installs.
 *
 * Example:
 * - `/cs-sacks-and-twines` when the app runs from a subdirectory
 * - `` when the app runs from the web root
 *
 * @return string
 */
if (!function_exists('app_base_path')) {
	function app_base_path(): string
	{
		// Cache the base path in a static variable to avoid recalculating it on every call
		static $basePath = null;

		// Calculate the base path if it hasn't been set yet
		if ($basePath === null) {
			// Use SCRIPT_NAME to get the path of the currently executing script, which is more reliable for determining the base path than REQUEST_URI
			$scriptName = str_replace('\\', '/', (string) ($_SERVER['SCRIPT_NAME'] ?? ''));
			// Remove the script filename from the path to get the base path of the application
			$basePath = rtrim(dirname($scriptName), '/');

			// If the base path is just '/' or '.', treat it as an empty string for easier URL building
			if ($basePath === '/' || $basePath === '.') {
				$basePath = '';
			}

			// Strip a trailing /public so URLs stay clean when the front controller lives there.
			if ($basePath !== '' && str_ends_with($basePath, '/public')) {
				$basePath = substr($basePath, 0, -strlen('/public'));
				if ($basePath === '/' || $basePath === '.') {
					$basePath = '';
				}
			}
		}

		return $basePath;
	}
}

/**
 * Normalize the current request path so route matching can ignore the base path
 * and treat trailing slashes consistently.
 *
 * @return string
 */
if (!function_exists('request_path')) {
	function request_path(): string
	{
		// Use parse_url to ignore query strings and fragments, and default to '/' if the path is empty
		$path = parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH) ?: '/';
		// Remove the base path if the app is running from a subdirectory
		$basePath = app_base_path();

		// Only remove the base path if it is not empty and the request path starts with it
		if ($basePath !== '' && str_starts_with($path, $basePath)) {
			$path = substr($path, strlen($basePath)) ?: '/';
		}

		// Support direct /public URLs by normalizing them to app route paths.
		if ($path === '/public' || str_starts_with($path, '/public/')) {
			$path = substr($path, strlen('/public')) ?: '/';
		}

		// Normalize the path to always start with a single slash and not end with a slash (except for the root path)
		$path = '/' . ltrim($path, '/');
		$path = rtrim($path, '/');

		// Return '/' if the path is empty after trimming, otherwise return the normalized path
		return $path === '' ? '/' : $path;
	}
}

/**
 * Build a route URL that stays valid whether the app is installed at the root
 * or inside a subdirectory.
 *
 * @param string $path
 * @return string
 */
if (!function_exists('routeUrl')) {
	function routeUrl(string $path): string
	{
		// All frontend links should go through this helper so the app works from /htdocs or a subfolder.
		return app_base_path() . $path;
	}
}

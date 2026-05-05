<?php

declare(strict_types=1);

require_once __DIR__ . '/../../core/db.php';
require_once __DIR__ . '/../../models/Dispatch.php';

/**
 * Handles dispatch history data requests.
 */
class DispatchesController
{
	/**
	 * No action needed - view is rendered by index.php after the shell.
	 *
	 * @return array<string, mixed>
	 */
	public function index(): array
	{
		return [];
	}

	/**
	 * Send a JSON response and stop rendering.
	 *
	 * @param array<string, mixed> $payload
	 * @param int $statusCode
	 * @return void
	 */
	private function jsonResponse(array $payload, int $statusCode): void
	{
		header('Content-Type: application/json; charset=UTF-8');
		http_response_code($statusCode);
		echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}';
		exit;
	}

	/**
	 * Return today's dispatches as JSON.
	 *
	 * @return void
	 */
	public function getTodayDispatchesJson(): void
	{
		header('Cache-Control: no-cache, no-store, must-revalidate');
		header('Pragma: no-cache');
		header('Expires: 0');

		$dispatch = new Dispatch(app_db());
		$dispatches = $dispatch->getTodayDispatches();

		$this->jsonResponse(
			[
				'success' => true,
				'dispatches' => $dispatches,
			],
			200
		);
	}

	/**
	 * Return dispatch items for a specific dispatch as JSON.
	 *
	 * @return void
	 */
	public function getDispatchItemsJson(): void
	{
		header('Cache-Control: no-cache, no-store, must-revalidate');
		header('Pragma: no-cache');
		header('Expires: 0');

		$dispatchId = (int) ($_GET['dispatch_id'] ?? 0);

		if ($dispatchId <= 0) {
			$this->jsonResponse(
				[
					'success' => false,
					'message' => 'A valid dispatch ID is required.',
				],
				400
			);
		}

		$dispatch = new Dispatch(app_db());
		$items = $dispatch->getDispatchItems($dispatchId);

		$this->jsonResponse(
			[
				'success' => true,
				'items' => $items,
			],
			200
		);
	}
}

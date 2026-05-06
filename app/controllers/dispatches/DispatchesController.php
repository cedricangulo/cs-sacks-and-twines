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

		app_json_response(
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
			app_json_response(
				[
					'success' => false,
					'message' => 'A valid dispatch ID is required.',
				],
				400
			);
		}

		$dispatch = new Dispatch(app_db());
		$items = $dispatch->getDispatchItems($dispatchId);

		app_json_response(
			[
				'success' => true,
				'items' => $items,
			],
			200
		);
	}
}

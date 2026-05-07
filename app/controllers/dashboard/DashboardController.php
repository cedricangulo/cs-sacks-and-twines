<?php

declare(strict_types=1);

require_once __DIR__ . '/../../core/db.php';
require_once __DIR__ . '/../../models/Dispatch.php';

/**
 * Handles dashboard data requests.
 */
class DashboardController
{
	/**
	 * Get stocks efficiency rate - ratio of dispatched vs received.
	 *
	 * @return void
	 */
	public function getEfficiency(): void
	{
		header('Cache-Control: no-cache, no-store, must-revalidate');
		header('Pragma: no-cache');
		header('Expires: 0');

		$dispatch = new Dispatch(app_db());
		$data = $dispatch->getEfficiencyData();

		app_json_response(
			[
				'success' => true,
				'dispatched' => (float) $data['dispatched'],
				'received' => (float) $data['received'],
			],
			200
		);
	}

	/**
	 * Get dispatch history grouped by date.
	 *
	 * @return void
	 */
	public function getDispatchHistory(): void
	{
		header('Cache-Control: no-cache, no-store, must-revalidate');
		header('Pragma: no-cache');
		header('Expires: 0');

		$range = $_GET['range'] ?? 'month';

		$dispatch = new Dispatch(app_db());
		$history = $dispatch->getDispatchHistoryByRange($range);

		app_json_response(
			[
				'success' => true,
				'data' => $history,
			],
			200
		);
	}

	public function getStats(): void
	{
		header('Cache-Control: no-cache, no-store, must-revalidate');
		header('Pragma: no-cache');
		header('Expires: 0');

		$dispatch = new Dispatch(app_db());
		$stats = $dispatch->getDashboardStats();

		app_json_response(
			[
				'success' => true,
				'data' => $stats,
			],
			200
		);
	}
}
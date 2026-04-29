<?php

declare(strict_types=1);

require_once __DIR__ . '/../../core/db.php';
require_once __DIR__ . '/../../models/Inventory.php';

/**
 * Handles batch data requests.
 */
class BatchController
{
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
	 * Return batches for a product as JSON.
	 *
	 * @return void
	 */
	public function getBatchesJson(): void
	{
		header('Cache-Control: public, max-age=300');
		header('Expires: ' . gmdate('D, d M Y H:i:s T', time() + 300));

		$productId = (int) ($_GET['product_id'] ?? 0);
		if ($productId <= 0) {
			$this->jsonResponse([
				'success' => false,
				'message' => 'A valid product ID is required.',
			], 400);
		}

		$limit = max(1, min(50, (int) ($_GET['limit'] ?? 3)));
		$offset = max(0, (int) ($_GET['offset'] ?? 0));

		$inventory = new Inventory(app_db());
		$batches = $inventory->batchesByProductId($productId, $limit, $offset);

		$this->jsonResponse([
			'success' => true,
			'batches' => $batches,
		], 200);
	}

	/**
	 * Return total batch count for a product as JSON.
	 *
	 * @return void
	 */
	public function getBatchCountJson(): void
	{
		header('Cache-Control: public, max-age=300');
		header('Expires: ' . gmdate('D, d M Y H:i:s T', time() + 300));

		$productId = (int) ($_GET['product_id'] ?? 0);
		if ($productId <= 0) {
			$this->jsonResponse([
				'success' => false,
				'message' => 'A valid product ID is required.',
			], 400);
		}

		$inventory = new Inventory(app_db());
		$count = $inventory->batchCountByProductId($productId);

		$this->jsonResponse([
			'success' => true,
			'count' => $count,
		], 200);
	}
}

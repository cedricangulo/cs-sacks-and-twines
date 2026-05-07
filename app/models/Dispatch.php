<?php

declare(strict_types=1);

/**
 * Dispatch model.
 *
 * Provides read access to dispatches and dispatch items.
 */
class Dispatch
{
	private PDO $pdo;

	public function __construct(PDO $pdo)
	{
		$this->pdo = $pdo;
	}

	/**
	 * Get today's dispatches with user name and item count.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public function getTodayDispatches(): array
	{
		$statement = $this->pdo->query(
			'SELECT
				d.dispatch_id,
				d.customer_reference,
				d.status,
				d.created_at,
				d.updated_at,
				u.name AS staff_name,
				(
					SELECT COUNT(*)
					FROM dispatch_items di
					WHERE di.dispatch_id = d.dispatch_id
				) AS total_items
			FROM dispatches d
			JOIN users u ON u.user_id = d.user_id
			WHERE DATE(d.created_at) = CURDATE()
			ORDER BY d.created_at DESC, d.dispatch_id DESC'
		);

		return $statement->fetchAll();
	}

	/**
	 * Get items for a specific dispatch with product name and batch code.
	 *
	 * @param int $dispatchId
	 * @return array<int, array<string, mixed>>
	 */
	public function getDispatchItems(int $dispatchId): array
	{
		$statement = $this->pdo->prepare(
			'SELECT
				di.dispatch_item_id,
				di.dispatch_id,
				di.dispatch_uom,
				di.dispatch_quantity,
				di.quantity_deducted,
				di.unit_cost,
				di.created_at,
				p.name AS product_name,
				b.batch_code
			FROM dispatch_items di
			JOIN products p ON p.product_id = di.product_id
			JOIN batches b ON b.batch_id = di.batch_id
			WHERE di.dispatch_id = :dispatch_id
			ORDER BY di.dispatch_item_id ASC'
		);
		$statement->execute(['dispatch_id' => $dispatchId]);

		return $statement->fetchAll();
	}

	/**
	 * Get total dispatched and received quantities for efficiency calculation.
	 *
	 * @return array<string, float>
	 */
	public function getEfficiencyData(): array
	{
		$receivedStmt = $this->pdo->query(
			'SELECT COALESCE(SUM(quantity_received), 0) AS total
			FROM batches
			WHERE status = "active"'
		);
		$received = (float) $receivedStmt->fetch()['total'] ?? 0;

		$dispatchedStmt = $this->pdo->query(
			'SELECT COALESCE(SUM(quantity_deducted), 0) AS total
			FROM dispatch_items di
			JOIN dispatches d ON d.dispatch_id = di.dispatch_id
			WHERE d.status = "completed"'
		);
		$dispatched = (float) $dispatchedStmt->fetch()['total'] ?? 0;

		return [
			'received' => $received,
			'dispatched' => $dispatched,
		];
	}

	/**
	 * Get dispatch history grouped by date for a given range.
	 *
	 * @param string $range today, week, month, 3months, year
	 * @return array<int, array<string, mixed>>
	 */
	public function getDispatchHistoryByRange(string $range = 'month'): array
	{
		$dateFormat = match ($range) {
			'today' => '%h %p',
			'week' => '%a',
			'month' => '%b %d',
			'3months' => '%b %d',
			'year' => '%b',
			default => '%b %d',
		};

		$interval = match ($range) {
			'today' => null,
			'week' => 'INTERVAL 7 DAY',
			'month' => 'INTERVAL 1 MONTH',
			'3months' => 'INTERVAL 3 MONTH',
			'year' => 'INTERVAL 1 YEAR',
			default => 'INTERVAL 1 MONTH',
		};

		$whereClause = $range === 'today'
			? "d.created_at >= CURDATE() AND d.created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)"
			: "d.created_at >= DATE_SUB(NOW(), {$interval})";

		$groupBy = $range === 'today' ? "DATE_FORMAT(d.created_at, '%Y-%m-%d %H:00:00')" : 'DATE(d.created_at)';
		$orderBy = $range === 'today' ? "DATE_FORMAT(d.created_at, '%Y-%m-%d %H:00:00')" : 'd.created_at';

		$statement = $this->pdo->query(
			"SELECT
				DATE_FORMAT(d.created_at, '{$dateFormat}') AS date,
				SUM(di.quantity_deducted) AS total_quantity
			FROM dispatch_items di
			JOIN dispatches d ON d.dispatch_id = di.dispatch_id
			WHERE d.status = 'completed'
			AND {$whereClause}
			GROUP BY {$groupBy}
			ORDER BY {$orderBy} ASC"
		);

		$results = $statement->fetchAll();

		return array_map(fn($row) => [
			'date' => $row['date'],
			'total_quantity' => (float) $row['total_quantity'],
		], $results);
	}

	/**
	 * Get dashboard statistics: asset value, dispatch value, and today's adjustments.
	 *
	 * @return array<string, mixed>
	 */
	public function getDashboardStats(): array
	{
		$assetStmt = $this->pdo->query(
			'SELECT COALESCE(SUM(quantity_remaining * unit_cost), 0) AS total
			FROM batches
			WHERE status = "active"'
		);
		$assetValue = (float) $assetStmt->fetch()['total'] ?? 0;

		$dispatchValueStmt = $this->pdo->query(
			'SELECT COALESCE(SUM(quantity_deducted * unit_cost), 0) AS total
			FROM dispatch_items di
			JOIN dispatches d ON d.dispatch_id = di.dispatch_id
			WHERE d.status = "completed"'
		);
		$dispatchValue = (float) $dispatchValueStmt->fetch()['total'] ?? 0;

		$adjustmentsStmt = $this->pdo->query(
			'SELECT COUNT(*) AS count
			FROM stock_adjustments
			WHERE DATE(created_at) = CURDATE()'
		);
		$adjustmentCount = (int) $adjustmentsStmt->fetch()['count'] ?? 0;

		$lowStockStmt = $this->pdo->query(
			"SELECT
				p.name,
				COALESCE(SUM(b.quantity_remaining), 0) AS current_qty
			FROM products p
			LEFT JOIN batches b ON b.product_id = p.product_id AND b.status = 'active'
			WHERE p.status = 'active'
			GROUP BY p.product_id, p.name, p.low_stock_threshold
			HAVING COALESCE(SUM(b.quantity_remaining), 0) <= p.low_stock_threshold
			ORDER BY current_qty ASC, p.name ASC"
		);
		$lowStockProducts = array_map(fn($row) => [
			'name' => $row['name'],
			'quantity' => (float) $row['current_qty'],
		], $lowStockStmt->fetchAll());

		$topProductsStmt = $this->pdo->query(
			"SELECT p.name, SUM(di.quantity_deducted) AS total_qty
			FROM dispatch_items di
			JOIN dispatches d ON d.dispatch_id = di.dispatch_id
			JOIN products p ON p.product_id = di.product_id
			WHERE d.status = 'completed'
			AND d.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
			GROUP BY di.product_id, p.name
			ORDER BY total_qty DESC
			LIMIT 3"
		);
		$topProducts = array_map(fn($row) => [
			'name' => $row['name'],
			'quantity' => (float) $row['total_qty'],
		], $topProductsStmt->fetchAll());

		$todayDispatchesStmt = $this->pdo->query(
			'SELECT COUNT(DISTINCT d.dispatch_id) AS count, COALESCE(SUM(di.quantity_deducted * di.unit_cost), 0) AS total_value
			FROM dispatches d
			LEFT JOIN dispatch_items di ON di.dispatch_id = d.dispatch_id
			WHERE d.status = "completed"
			AND d.created_at >= CURDATE()
			AND d.created_at < DATE_ADD(CURDATE(), INTERVAL 1 DAY)'
		);
		$todayData = $todayDispatchesStmt->fetch();

		return [
			'asset_value' => $assetValue,
			'dispatch_value' => $dispatchValue,
			'adjustments_today' => $adjustmentCount,
			'low_stock_products' => $lowStockProducts,
			'top_products' => $topProducts,
			'today_dispatch_count' => (int) ($todayData['count'] ?? 0),
			'today_dispatch_value' => (float) ($todayData['total_value'] ?? 0),
		];
	}
}

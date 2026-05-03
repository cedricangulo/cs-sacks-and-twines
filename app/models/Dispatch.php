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
}
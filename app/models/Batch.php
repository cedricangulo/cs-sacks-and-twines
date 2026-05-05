<?php

declare(strict_types=1);

/**
 * Batch model.
 *
 * Provides access to batch records and related operations.
 */
class Batch
{
	private PDO $pdo;

	public function __construct(PDO $pdo)
	{
		$this->pdo = $pdo;
	}

	/**
	 * Check if a batch has dispatch items.
	 *
	 * @param int $batchId
	 * @return bool
	 */
	public function hasDispatches(int $batchId): bool
	{
		$statement = $this->pdo->prepare(
			'SELECT 1 FROM dispatch_items WHERE batch_id = :batch_id LIMIT 1'
		);
		$statement->execute(['batch_id' => $batchId]);

		return $statement->fetchColumn() !== false;
	}

	/**
	 * Check if a batch has active stock adjustments.
	 *
	 * @param int $batchId
	 * @return bool
	 */
	public function hasActiveAdjustments(int $batchId): bool
	{
		$statement = $this->pdo->prepare(
			'SELECT 1 FROM stock_adjustments WHERE batch_id = :batch_id AND status = :status LIMIT 1'
		);
		$statement->execute(['batch_id' => $batchId, 'status' => 'applied']);

		return $statement->fetchColumn() !== false;
	}

	/**
	 * Count dispatch items for a batch.
	 *
	 * @param int $batchId
	 * @return int
	 */
	public function countDispatchItems(int $batchId): int
	{
		$statement = $this->pdo->prepare(
			'SELECT COUNT(*) FROM dispatch_items WHERE batch_id = :batch_id'
		);
		$statement->execute(['batch_id' => $batchId]);

		return (int) $statement->fetchColumn();
	}

	/**
	 * Count active stock adjustments for a batch.
	 *
	 * @param int $batchId
	 * @return int
	 */
	public function countActiveAdjustments(int $batchId): int
	{
		$statement = $this->pdo->prepare(
			'SELECT COUNT(*) FROM stock_adjustments WHERE batch_id = :batch_id AND status = :status'
		);
		$statement->execute(['batch_id' => $batchId, 'status' => 'applied']);

		return (int) $statement->fetchColumn();
	}

	/**
	 * Update batch inventory fields.
	 *
	 * @param int $batchId
	 * @param int $supplierId
	 * @param string $totalProcurementCost
	 * @param string $unitCost
	 * @param string $quantityReceived
	 * @param string $quantityRemaining
	 * @param string $status
	 * @return void
	 */
	public function updateInventoryFields(int $batchId, int $supplierId, string $totalProcurementCost, string $unitCost, string $quantityReceived, string $quantityRemaining, string $status): void
	{
		$statement = $this->pdo->prepare(
			'UPDATE batches
			 SET supplier_id = :supplier_id,
			     total_procurement_cost = :total_procurement_cost,
			     unit_cost = :unit_cost,
			     quantity_received = :quantity_received,
			     quantity_remaining = :quantity_remaining,
			     status = :status,
			     updated_at = CURRENT_TIMESTAMP
			 WHERE batch_id = :batch_id'
		);
		$statement->execute([
			'supplier_id' => $supplierId,
			'total_procurement_cost' => $totalProcurementCost,
			'unit_cost' => $unitCost,
			'quantity_received' => $quantityReceived,
			'quantity_remaining' => $quantityRemaining,
			'status' => $status,
			'batch_id' => $batchId,
		]);
	}

	/**
	 * Mark a batch as voided.
	 *
	 * @param int $batchId
	 * @return int Number of rows affected
	 */
	public function markVoided(int $batchId): int
	{
		$statement = $this->pdo->prepare(
			'UPDATE batches SET status = \'voided\', updated_at = CURRENT_TIMESTAMP WHERE batch_id = :batch_id'
		);
		$statement->execute(['batch_id' => $batchId]);

		return $statement->rowCount();
	}

	/**
	 * Void all applied stock adjustments for a batch.
	 *
	 * @param int $batchId
	 * @return int Number of adjustments voided
	 */
	public function voidAdjustments(int $batchId): int
	{
		$statement = $this->pdo->prepare(
			'UPDATE stock_adjustments SET status = \'voided\', updated_at = CURRENT_TIMESTAMP WHERE batch_id = :batch_id AND status = \'applied\''
		);
		$statement->execute(['batch_id' => $batchId]);

		return $statement->rowCount();
	}
}

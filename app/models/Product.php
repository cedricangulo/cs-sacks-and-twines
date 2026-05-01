<?php

declare(strict_types=1);

/**
 * Product model.
 *
 * Provides read and write access to products, batches, and dispatches.
 */
class Product
{
	private PDO $pdo;

	public function __construct(PDO $pdo)
	{
		$this->pdo = $pdo;
	}

	/**
	 * Get all products for the inventory combobox.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public function allProducts(): array
	{
		$statement = $this->pdo->query(
			'SELECT
				p.product_id,
				p.sku_code,
				p.name,
				p.category,
				p.base_uom,
				p.weight_per_unit,
				p.current_quantity,
				p.total_asset_value,
				p.status,
				p.low_stock_threshold,
				p.image_path,
				p.updated_at,
				(
					SELECT b.supplier_id
					FROM batches b
					WHERE b.product_id = p.product_id
					ORDER BY b.created_at DESC, b.batch_id DESC
					LIMIT 1
				) AS default_supplier_id
			FROM products p
			ORDER BY p.name ASC'
		);

		return $statement->fetchAll();
	}

	/**
	 * Get all products for stock-out page (simpler query).
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public function getProductsList(): array
	{
		$statement = $this->pdo->query(
			'SELECT
				p.product_id,
				p.sku_code,
				p.name,
				p.category,
				p.base_uom,
				p.weight_per_unit,
				p.current_quantity,
				p.status,
				p.image_path,
				p.low_stock_threshold,
				p.updated_at
			FROM products p
			WHERE p.status = \'active\'
			ORDER BY p.name ASC'
		);

		return $statement->fetchAll();
	}

	/**
	 * Get all suppliers for the inventory supplier select.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	public function allSuppliers(): array
	{
		$statement = $this->pdo->query(
			'SELECT supplier_id, company_name, contact_person, contact_number FROM suppliers ORDER BY company_name ASC'
		);

		return $statement->fetchAll();
	}

	/**
	 * Find one product record by id.
	 *
	 * @param int $productId
	 * @return array<string, mixed>|null
	 */
	public function findProductById(int $productId): ?array
	{
		$statement = $this->pdo->prepare(
			'SELECT
				p.product_id,
				p.sku_code,
				p.name,
				p.category,
				p.base_uom,
				p.weight_per_unit,
				p.current_quantity,
				p.base_uom,
				(
					SELECT b.supplier_id
					FROM batches b
					WHERE b.product_id = p.product_id
					ORDER BY b.created_at DESC, b.batch_id DESC
					LIMIT 1
				) AS default_supplier_id
			FROM products p
			WHERE p.product_id = :product_id
			LIMIT 1'
		);
		$statement->execute(['product_id' => $productId]);
		$product = $statement->fetch();

		return $product === false ? null : $product;
	}

	/**
	 * Check whether a product name already exists.
	 *
	 * @param string $name
	 * @return bool
	 */
	public function productNameExists(string $name): bool
	{
		$statement = $this->pdo->prepare('SELECT 1 FROM products WHERE LOWER(name) = LOWER(:name) LIMIT 1');
		$statement->execute(['name' => $name]);

		return $statement->fetchColumn() !== false;
	}

	/**
	 * Check whether a SKU already exists.
	 *
	 * @param string $skuCode
	 * @return bool
	 */
	public function skuCodeExists(string $skuCode): bool
	{
		$statement = $this->pdo->prepare('SELECT 1 FROM products WHERE sku_code = :sku_code LIMIT 1');
		$statement->execute(['sku_code' => $skuCode]);

		return $statement->fetchColumn() !== false;
	}

	/**
	 * Check whether a batch code already exists.
	 *
	 * @param string $batchCode
	 * @return bool
	 */
	public function batchCodeExists(string $batchCode): bool
	{
		$statement = $this->pdo->prepare('SELECT 1 FROM batches WHERE batch_code = :batch_code LIMIT 1');
		$statement->execute(['batch_code' => $batchCode]);

		return $statement->fetchColumn() !== false;
	}

	/**
	 * Create a product record.
	 *
	 * @param string $skuCode
	 * @param string $name
	 * @param string $category
	 * @param string $baseUom
	 * @param string|int|float $weightPerUnit
	 * @param string|int|float $currentStock
	 * @param string|null $imagePath
	 * @param string|int|float $lowStockThreshold
	 * @return int
	 */
	public function createProduct(string $skuCode, string $name, string $category, string $baseUom, $weightPerUnit, $currentStock = '0.00', ?string $imagePath = null, $lowStockThreshold = '0.00'): int
	{
		$statement = $this->pdo->prepare(
			'INSERT INTO products (sku_code, name, category, base_uom, weight_per_unit, current_quantity, image_path, low_stock_threshold)
			 VALUES (:sku_code, :name, :category, :base_uom, :weight_per_unit, :current_quantity, :image_path, :low_stock_threshold)'
		);
		$statement->execute([
			'sku_code' => $skuCode,
			'name' => $name,
			'category' => $category,
			'base_uom' => $baseUom,
			'weight_per_unit' => $weightPerUnit,
			'current_quantity' => $currentStock,
			'image_path' => $imagePath,
			'low_stock_threshold' => $lowStockThreshold,
		]);

		return (int) $this->pdo->lastInsertId();
	}

	/**
	 * Update an existing product's catalog fields.
	 *
	 * @param int $productId
	 * @param string $category
	 * @param string $baseUom
	 * @param string|int|float|null $lowStockThreshold
	 * @return void
	 */
	public function updateProductCatalog(int $productId, string $category, string $baseUom, $lowStockThreshold = null): void
	{
		$statement = $this->pdo->prepare(
			'UPDATE products
			 SET category = :category,
			     base_uom = :base_uom,
			     low_stock_threshold = COALESCE(:low_stock_threshold, low_stock_threshold),
			     updated_at = CURRENT_TIMESTAMP
			 WHERE product_id = :product_id'
		);
		$statement->execute([
			'category' => $category,
			'base_uom' => $baseUom,
			'low_stock_threshold' => $lowStockThreshold,
			'product_id' => $productId,
		]);
	}

	/**
	 * Update a product's image path.
	 *
	 * @param int $productId
	 * @param string|null $imagePath
	 * @return void
	 */
	public function updateProductImage(int $productId, ?string $imagePath): void
	{
		$statement = $this->pdo->prepare(
			'UPDATE products
			 SET image_path = :image_path,
			     updated_at = CURRENT_TIMESTAMP
			 WHERE product_id = :product_id'
		);
		$statement->execute([
			'image_path' => $imagePath,
			'product_id' => $productId,
		]);
	}

	/**
	 * Insert a new batch.
	 *
	 * @param int $productId
	 * @param int $supplierId
	 * @param int $userId
	 * @param string $batchCode
	 * @param string|int|float $totalProcurementCost
	 * @param string|int|float $quantityReceived
	 * @return int
	 */
	public function insertBatch(int $productId, int $supplierId, int $userId, string $batchCode, $totalProcurementCost, $quantityReceived): int
	{
		$quantityReceivedFloat = (float) $quantityReceived;
		$totalProcurementCostFloat = (float) $totalProcurementCost;
		$unitCost = $quantityReceivedFloat > 0 ? $totalProcurementCostFloat / $quantityReceivedFloat : 0.0;

		$statement = $this->pdo->prepare(
			'INSERT INTO batches (
				product_id,
				supplier_id,
				user_id,
				batch_code,
				total_procurement_cost,
				unit_cost,
				quantity_received,
				quantity_remaining
			) VALUES (
				:product_id,
				:supplier_id,
				:user_id,
				:batch_code,
				:total_procurement_cost,
				:unit_cost,
				:quantity_received,
				:quantity_remaining
			)'
		);
		$statement->execute([
			'product_id' => $productId,
			'supplier_id' => $supplierId,
			'user_id' => $userId,
			'batch_code' => $batchCode,
			'total_procurement_cost' => (string) $totalProcurementCostFloat,
			'unit_cost' => (string) $unitCost,
			'quantity_received' => $quantityReceived,
			'quantity_remaining' => $quantityReceived,
		]);

		return (int) $this->pdo->lastInsertId();
	}

	/**
	 * Get batches for a specific product.
	 *
	 * @param int $productId
	 * @param int $limit
	 * @param int $offset
	 * @return array<int, array<string, mixed>>
	 */
	public function batchesByProductId(int $productId, int $limit = 3, int $offset = 0): array
	{
		$statement = $this->pdo->prepare(
			'SELECT
				b.batch_id,
				b.batch_code,
				b.unit_cost,
				b.quantity_received,
				b.quantity_remaining,
				b.status,
				b.created_at,
				b.updated_at,
				s.company_name AS supplier_name
			FROM batches b
			JOIN suppliers s ON s.supplier_id = b.supplier_id
			WHERE b.product_id = :product_id
			ORDER BY b.created_at DESC, b.batch_id DESC
			LIMIT :limit OFFSET :offset'
		);
		$statement->bindValue('product_id', $productId, PDO::PARAM_INT);
		$statement->bindValue('limit', $limit, PDO::PARAM_INT);
		$statement->bindValue('offset', $offset, PDO::PARAM_INT);
		$statement->execute();

		return $statement->fetchAll();
	}

	/**
	 * Get batches for dispatch (FIFO - oldest first, active only).
	 *
	 * @param int $productId
	 * @return array<int, array<string, mixed>>
	 */
	public function getBatchesForDispatch(int $productId): array
	{
		$statement = $this->pdo->prepare(
			'SELECT
				b.batch_id,
				b.batch_code,
				b.unit_cost,
				b.quantity_remaining,
				b.status,
				b.created_at
			FROM batches b
			WHERE b.product_id = :product_id
			  AND b.status = \'active\'
			  AND b.quantity_remaining > 0
			ORDER BY b.created_at ASC, b.batch_id ASC'
		);
		$statement->execute(['product_id' => $productId]);

		return $statement->fetchAll();
	}

	/**
	 * Count batches for a specific product.
	 *
	 * @param int $productId
	 * @return int
	 */
	public function batchCountByProductId(int $productId): int
	{
		$statement = $this->pdo->prepare(
			'SELECT COUNT(*) FROM batches WHERE product_id = :product_id'
		);
		$statement->bindValue('product_id', $productId, PDO::PARAM_INT);
		$statement->execute();

		return (int) $statement->fetchColumn();
	}

	/**
	 * Increment product stock and asset value after a batch insert.
	 *
	 * @param int $productId
	 * @param string|int|float $quantity
	 * @param string|int|float $assetValueIncrease
	 * @return void
	 */
	public function incrementProductStock(int $productId, $quantity, $assetValueIncrease): void
	{
		$statement = $this->pdo->prepare(
			'UPDATE products
			 SET current_quantity = current_quantity + :quantity,
			     total_asset_value = total_asset_value + :asset_value,
			     updated_at = CURRENT_TIMESTAMP
			 WHERE product_id = :product_id'
		);
		$statement->execute([
			'quantity' => $quantity,
			'asset_value' => $assetValueIncrease,
			'product_id' => $productId,
		]);
	}

	/**
	 * Decrement product stock after dispatch.
	 *
	 * @param int $productId
	 * @param string|int|float $quantity
	 * @return void
	 */
	public function decrementProductStock(int $productId, $quantity): void
	{
		$statement = $this->pdo->prepare(
			'UPDATE products
			 SET current_quantity = current_quantity - :quantity,
			     updated_at = CURRENT_TIMESTAMP
			 WHERE product_id = :product_id'
		);
		$statement->execute([
			'quantity' => $quantity,
			'product_id' => $productId,
		]);
	}

	/**
	 * Update batch status to depleted if quantity_remaining is zero.
	 *
	 * @param int $batchId
	 * @return void
	 */
	public function updateBatchStatus(int $batchId): void
	{
		$statement = $this->pdo->prepare(
			'UPDATE batches
			 SET status = CASE
			   WHEN quantity_remaining <= 0 THEN \'depleted\'
			   ELSE status
			 END,
			 updated_at = CURRENT_TIMESTAMP
			 WHERE batch_id = :batch_id'
		);
		$statement->execute(['batch_id' => $batchId]);
	}

	/**
	 * Deduct from batches using FIFO logic.
	 *
	 * @param int $productId
	 * @param float $quantity
	 * @param int $dispatchId
	 * @param int $userId
	 * @param string $dispatchUom
	 * @param string $category
	 * @return int Number of batches used
	 */
	public function deductFromBatches(int $productId, float $quantity, int $dispatchId, int $userId, string $dispatchUom = 'piece', string $category = ''): int
	{
		if ($category === 'twines' && $dispatchUom === 'kilo') {
			$quantity = $quantity / 20.0;
			$dispatchUom = 'roll';
		}

		$batches = $this->getBatchesForDispatch($productId);
		$remainingToDeduct = $quantity;
		$batchesUsed = 0;

		foreach ($batches as $batch) {
			if ($remainingToDeduct <= 0) {
				break;
			}

			$batchId = (int) $batch['batch_id'];
			$batchRemaining = (float) $batch['quantity_remaining'];
			$unitCost = (float) $batch['unit_cost'];

			$toDeduct = min($batchRemaining, $remainingToDeduct);

			$updateStmt = $this->pdo->prepare(
				'UPDATE batches
				 SET quantity_remaining = quantity_remaining - :qty_deduct,
				     updated_at = CURRENT_TIMESTAMP
				 WHERE batch_id = :batch_id AND quantity_remaining >= :qty_remaining'
			);
			$updateStmt->execute([
				'qty_deduct' => $toDeduct,
				'batch_id' => $batchId,
				'qty_remaining' => $toDeduct,
			]);

			if ($updateStmt->rowCount() === 0) {
				continue;
			}

			$this->updateBatchStatus($batchId);

			$dispatchItemStmt = $this->pdo->prepare(
				'INSERT INTO dispatch_items (
					dispatch_id,
					batch_id,
					product_id,
					dispatch_uom,
					dispatch_quantity,
					quantity_deducted,
					unit_cost
				) VALUES (
					:dispatch_id,
					:batch_id,
					:product_id,
					:dispatch_uom,
					:dispatch_quantity,
					:quantity_deducted,
					:unit_cost
				)'
			);
			$dispatchItemStmt->execute([
				'dispatch_id' => $dispatchId,
				'batch_id' => $batchId,
				'product_id' => $productId,
				'dispatch_uom' => $dispatchUom,
				'dispatch_quantity' => $toDeduct,
				'quantity_deducted' => $toDeduct,
				'unit_cost' => $unitCost,
			]);

			$remainingToDeduct -= $toDeduct;
			$batchesUsed += 1;
		}

		if ($batchesUsed > 0) {
			$this->decrementProductStock($productId, $quantity);
		}

		return $batchesUsed;
	}

	/**
	 * Create a dispatch record.
	 *
	 * @param int $userId
	 * @param string|null $customerReference
	 * @return int
	 */
	public function createDispatch(int $userId, ?string $customerReference = null): int
	{
		$statement = $this->pdo->prepare(
			'INSERT INTO dispatches (user_id, customer_reference) VALUES (:user_id, :customer_reference)'
		);
		$statement->execute([
			'user_id' => $userId,
			'customer_reference' => $customerReference,
		]);

		return (int) $this->pdo->lastInsertId();
	}
}
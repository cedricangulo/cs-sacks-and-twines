<?php

declare(strict_types=1);

/**
 * Inventory model.
 *
 * Provides read access to products and suppliers for the inventory intake UI.
 */
class Inventory
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
				p.id,
				p.sku_code,
				p.name,
				p.category,
				p.base_uom,
				p.current_stock,
				p.updated_at,
				(
					SELECT b.supplier_id
					FROM batches b
					WHERE b.product_id = p.id
					ORDER BY b.created_at DESC, b.id DESC
					LIMIT 1
				) AS default_supplier_id
			FROM products p
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
			'SELECT id, company_name, contact_person, contact_number FROM suppliers ORDER BY company_name ASC'
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
				p.id,
				p.sku_code,
				p.name,
				p.category,
				p.base_uom,
				p.current_stock,
				(
					SELECT b.supplier_id
					FROM batches b
					WHERE b.product_id = p.id
					ORDER BY b.created_at DESC, b.id DESC
					LIMIT 1
				) AS default_supplier_id
			FROM products p
			WHERE p.id = :product_id
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
	 * @param string|int|float $currentStock
	 * @return int
	 */
	public function createProduct(string $skuCode, string $name, string $category, string $baseUom, $currentStock = '0.00'): int
	{
		$statement = $this->pdo->prepare(
			'INSERT INTO products (sku_code, name, category, base_uom, current_stock)
			 VALUES (:sku_code, :name, :category, :base_uom, :current_stock)'
		);
		$statement->execute([
			'sku_code' => $skuCode,
			'name' => $name,
			'category' => $category,
			'base_uom' => $baseUom,
			'current_stock' => $currentStock,
		]);

		return (int) $this->pdo->lastInsertId();
	}

	/**
	 * Update an existing product's catalog fields.
	 *
	 * @param int $productId
	 * @param string $category
	 * @param string $baseUom
	 * @return void
	 */
	public function updateProductCatalog(int $productId, string $category, string $baseUom): void
	{
		$statement = $this->pdo->prepare(
			'UPDATE products
			 SET category = :category,
			     base_uom = :base_uom,
			     updated_at = CURRENT_TIMESTAMP
			 WHERE id = :product_id'
		);
		$statement->execute([
			'category' => $category,
			'base_uom' => $baseUom,
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
	 * @param string|int|float $unitCost
	 * @param string|int|float $quantityReceived
	 * @return int
	 */
	public function insertBatch(int $productId, int $supplierId, int $userId, string $batchCode, $unitCost, $quantityReceived): int
	{
		$statement = $this->pdo->prepare(
			'INSERT INTO batches (
				batch_code,
				unit_cost,
				quantity_received,
				quantity_remaining,
				product_id,
				supplier_id,
				user_id
			) VALUES (
				:batch_code,
				:unit_cost,
				:quantity_received,
				:quantity_remaining,
				:product_id,
				:supplier_id,
				:user_id
			)'
		);
		$statement->execute([
			'batch_code' => $batchCode,
			'unit_cost' => $unitCost,
			'quantity_received' => $quantityReceived,
			'quantity_remaining' => $quantityReceived,
			'product_id' => $productId,
			'supplier_id' => $supplierId,
			'user_id' => $userId,
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
				b.id,
				b.batch_code,
				b.unit_cost,
				b.quantity_received,
				b.quantity_remaining,
				b.created_at,
				b.updated_at,
				s.company_name AS supplier_name
			FROM batches b
			JOIN suppliers s ON s.id = b.supplier_id
			WHERE b.product_id = :product_id
			ORDER BY b.created_at DESC, b.id DESC
			LIMIT :limit OFFSET :offset'
		);
		$statement->bindValue('product_id', $productId, PDO::PARAM_INT);
		$statement->bindValue('limit', $limit, PDO::PARAM_INT);
		$statement->bindValue('offset', $offset, PDO::PARAM_INT);
		$statement->execute();

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
	 * Increment product stock after a batch insert.
	 *
	 * @param int $productId
	 * @param string|int|float $quantity
	 * @return void
	 */
	public function incrementProductStock(int $productId, $quantity): void
	{
		$statement = $this->pdo->prepare(
			'UPDATE products
			 SET current_stock = current_stock + :quantity,
			     updated_at = CURRENT_TIMESTAMP
			 WHERE id = :product_id'
		);
		$statement->execute([
			'quantity' => $quantity,
			'product_id' => $productId,
		]);
	}
}

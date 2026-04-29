<?php

declare(strict_types=1);

require_once __DIR__ . '/../../core/db.php';
require_once __DIR__ . '/../../models/Inventory.php';

/**
 * Handles inventory screens and data loading.
 */
class InventoryController
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
	 * Normalize a submitted decimal value.
	 *
	 * @param mixed $value
	 * @return string
	 */
	private function normalizeDecimal($value): string
	{
		$normalized = trim((string) $value);

		return is_numeric($normalized) ? $normalized : '';
	}

	/**
	 * Generate a unique product SKU.
	 *
	 * @param Inventory $inventory
	 * @return string
	 */
	private function generateSkuCode(Inventory $inventory): string
	{
		$attempts = 0;

		do {
			$attempts += 1;
			$skuCode = sprintf('SKU-%s-%04d', date('Ymd'), random_int(1000, 9999));
		} while ($inventory->skuCodeExists($skuCode) && $attempts < 20);

		return $skuCode;
	}

	/**
	 * Generate a unique batch code.
	 *
	 * @param Inventory $inventory
	 * @return string
	 */
	private function generateBatchCode(Inventory $inventory): string
	{
		$attempts = 0;

		do {
			$attempts += 1;
			$batchCode = sprintf('BAT-%s-%04d', date('Ymd'), random_int(1000, 9999));
		} while ($inventory->batchCodeExists($batchCode) && $attempts < 20);

		return $batchCode;
	}

	/**
	 * Load products and suppliers for the inventory intake screen.
	 *
	 * @return array{products: array<int, array<string, mixed>>, suppliers: array<int, array<string, mixed>>}
	 */
	public function index(): array
	{
		$inventory = new Inventory(app_db());

		return [
			'products' => $inventory->allProducts(),
			'suppliers' => $inventory->allSuppliers(),
		];
	}

	/**
	 * Return all products as JSON for the async inventory table.
	 *
	 * @return void
	 */
	public function getProductsJson(): void
	{
		// Cache the response for 5 minutes in the browser
		header('Cache-Control: public, max-age=300');
		header('Expires: ' . gmdate('D, d M Y H:i:s T', time() + 300));
		
		$inventory = new Inventory(app_db());
		$this->jsonResponse($inventory->allProducts(), 200);
	}

	/**
	 * Save inventory intake data from the async fetch request.
	 *
	 * @return void
	 */
	public function save(): void
	{
		if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
			$this->jsonResponse([
				'success' => false,
				'message' => 'Method not allowed.',
			], 405);
		}

		$userId = (int) ($_SESSION['user']['id'] ?? 0);
		if ($userId <= 0) {
			$this->jsonResponse([
				'success' => false,
				'message' => 'You must be signed in to save inventory.',
			], 401);
		}

		$pdo = app_db();
		$inventory = new Inventory($pdo);
		$mode = strtolower(trim((string) ($_POST['mode'] ?? 'existing')));
		$productId = (int) ($_POST['product_id'] ?? 0);
		$itemName = trim((string) ($_POST['name'] ?? ''));
		$category = trim((string) ($_POST['category'] ?? ''));
		$baseUom = trim((string) ($_POST['base_uom'] ?? ''));
		$supplierId = (int) ($_POST['supplier_id'] ?? 0);
		$quantityReceived = $this->normalizeDecimal($_POST['quantity_received'] ?? '');
		$unitCost = $this->normalizeDecimal($_POST['unit_cost'] ?? '');
		$allowedCategories = ['sacks', 'twines'];
		$allowedUnits = ['pieces', 'kilos'];

		if (!in_array($mode, ['existing', 'new'], true)) {
			$this->jsonResponse([
				'success' => false,
				'message' => 'Choose a valid inventory mode.',
			], 422);
		}

		if ($quantityReceived === '' || (float) $quantityReceived <= 0) {
			$this->jsonResponse([
				'success' => false,
				'message' => 'Quantity must be greater than zero.',
			], 422);
		}

		if ($unitCost === '' || (float) $unitCost <= 0) {
			$this->jsonResponse([
				'success' => false,
				'message' => 'Total procurement cost must be greater than zero.',
			], 422);
		}

		if ($mode === 'new') {
			if ($itemName === '') {
				$this->jsonResponse([
					'success' => false,
					'message' => 'Enter an item name for the new product.',
				], 422);
			}

			if ($category === '' || !in_array($category, $allowedCategories, true)) {
				$this->jsonResponse([
					'success' => false,
					'message' => 'Select a valid category for the new product.',
				], 422);
			}

			if ($baseUom === '' || !in_array($baseUom, $allowedUnits, true)) {
				$this->jsonResponse([
					'success' => false,
					'message' => 'Select a valid unit of measurement for the new product.',
				], 422);
			}

			if ($supplierId <= 0) {
				$this->jsonResponse([
					'success' => false,
					'message' => 'Select a supplier for the new item.',
				], 422);
			}
		}

		if ($mode === 'existing' && $productId <= 0) {
			$this->jsonResponse([
				'success' => false,
				'message' => 'Choose an existing item before saving stock.',
			], 422);
		}

		try {
			$pdo->beginTransaction();

			if ($mode === 'existing') {
				$product = $inventory->findProductById($productId);

				if ($product === null) {
					throw new DomainException('The selected item no longer exists.');
				}

				$category = $category !== '' ? $category : (string) ($product['category'] ?? '');
				$baseUom = $baseUom !== '' ? $baseUom : (string) ($product['base_uom'] ?? '');
				$supplierId = $supplierId > 0 ? $supplierId : (int) ($product['default_supplier_id'] ?? 0);

				if ($category === '' || !in_array($category, $allowedCategories, true)) {
					throw new DomainException('The selected item category is invalid.');
				}

				if ($baseUom === '' || !in_array($baseUom, $allowedUnits, true)) {
					throw new DomainException('The selected item unit is invalid.');
				}

				if ($supplierId <= 0) {
					throw new DomainException('Select a supplier before saving stock.');
				}

				if ($category !== (string) ($product['category'] ?? '') || $baseUom !== (string) ($product['base_uom'] ?? '')) {
					$inventory->updateProductCatalog($productId, $category, $baseUom);
				}
			} else {
				if ($inventory->productNameExists($itemName)) {
					throw new DomainException('That item name already exists.');
				}

				$skuCode = $this->generateSkuCode($inventory);

				if ($inventory->skuCodeExists($skuCode)) {
					throw new DomainException('Unable to generate a unique SKU. Please try again.');
				}

				$productId = $inventory->createProduct($skuCode, $itemName, $category, $baseUom, '0.00');
			}

			$batchCode = $this->generateBatchCode($inventory);

			if ($inventory->batchCodeExists($batchCode)) {
				throw new DomainException('Unable to generate a unique batch code. Please try again.');
			}

			$inventory->insertBatch(
				$productId,
				$supplierId,
				$userId,
				$batchCode,
				$unitCost,
				$quantityReceived
			);
			$inventory->incrementProductStock($productId, $quantityReceived);

			$pdo->commit();

			$this->jsonResponse([
				'success' => true,
				'message' => $mode === 'new' ? 'New item saved successfully.' : 'Stock saved successfully.',
				'data' => [
					'product_id' => $productId,
					'batch_code' => $batchCode,
				],
			], 200);
		} catch (InvalidArgumentException|DomainException $throwable) {
			if ($pdo->inTransaction()) {
				$pdo->rollBack();
			}

			$this->jsonResponse([
				'success' => false,
				'message' => $throwable->getMessage(),
			], 422);
		} catch (Throwable $throwable) {
			if ($pdo->inTransaction()) {
				$pdo->rollBack();
			}

			$this->jsonResponse([
				'success' => false,
				'message' => 'Unable to save inventory right now. Please try again.',
			], 422);
		}
	}
}

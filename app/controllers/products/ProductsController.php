<?php

declare(strict_types=1);

require_once __DIR__ . '/../../core/db.php';
require_once __DIR__ . '/../../core/uploads.php';
require_once __DIR__ . '/../../models/Product.php';
require_once __DIR__ . '/../../models/AuditLog.php';

/**
 * Handles inventory screens and data loading.
 */
class ProductsController
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
	 * @param Product $product
	 * @return string
	 */
	private function generateSkuCode(Product $product): string
	{
		$attempts = 0;

		do {
			$attempts += 1;
			$skuCode = sprintf('SKU-%s-%04d', date('Ymd'), random_int(1000, 9999));
		} while ($product->skuCodeExists($skuCode) && $attempts < 20);

		return $skuCode;
	}

	/**
	 * Generate a unique batch code.
	 *
	 * @param Product $product
	 * @return string
	 */
	private function generateBatchCode(Product $product): string
	{
		$attempts = 0;

		do {
			$attempts += 1;
			$batchCode = sprintf('BAT-%s-%04d', date('Ymd'), random_int(1000, 9999));
		} while ($product->batchCodeExists($batchCode) && $attempts < 20);

		return $batchCode;
	}

	/**
	 * Load products and suppliers for the inventory intake screen.
	 *
	 * @return array{products: array<int, array<string, mixed>>, suppliers: array<int, array<string, mixed>>}
	 */
	public function index(): array
	{
		$product = new Product(app_db());

		return [
			'products' => $product->allProducts(),
			'suppliers' => $product->allSuppliers(),
		];
	}

	/**
	 * Return all products as JSON for the async inventory table.
	 *
	 * @return void
	 */
	public function getProductsJson(): void
	{
		header('Cache-Control: public, max-age=300');
		header('Expires: ' . gmdate('D, d M Y H:i:s T', time() + 300));

		$product = new Product(app_db());
		$this->jsonResponse($product->allProducts(), 200);
	}

	/**
	 * Return all products for products list (stock-out page).
	 *
	 * @return void
	 */
	public function getProductsListJson(): void
	{
		header('Cache-Control: public, max-age=300');
		header('Expires: ' . gmdate('D, d M Y H:i:s T', time() + 300));

		$product = new Product(app_db());
		$this->jsonResponse($product->getProductsList(), 200);
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

		$userId = (int) ($_SESSION['user']['user_id'] ?? 0);
		if ($userId <= 0) {
			$this->jsonResponse([
				'success' => false,
				'message' => 'You must be signed in to save inventory.',
			], 401);
		}

		$pdo = app_db();
		$product = new Product($pdo);
		$mode = strtolower(trim((string) ($_POST['mode'] ?? 'existing')));
		$productId = (int) ($_POST['product_id'] ?? 0);
		$itemName = trim((string) ($_POST['name'] ?? ''));
		$category = trim((string) ($_POST['category'] ?? ''));
		$baseUom = trim((string) ($_POST['base_uom'] ?? ''));
		$weightPerUnit = $this->normalizeDecimal($_POST['weight_per_unit'] ?? '');
		$supplierId = (int) ($_POST['supplier_id'] ?? 0);
		$quantityReceived = $this->normalizeDecimal($_POST['quantity_received'] ?? '');
		$totalProcurementCost = $this->normalizeDecimal($_POST['total_procurement_cost'] ?? '');
		$lowStockThreshold = $this->normalizeDecimal($_POST['low_stock_threshold'] ?? '0');
		$imagePath = null;
		if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
			$imagePath = app_upload_product_image($_FILES['image']);
		}
		$allowedCategories = ['sacks', 'twines'];
		$allowedUnits = ['piece', 'roll'];

		$errors = [];

		if (!in_array($mode, ['existing', 'new'], true)) {
			$errors['mode'] = 'Choose a valid inventory mode.';
		}

		if ($quantityReceived === '' || (float) $quantityReceived <= 0) {
			$errors['quantity_received'] = 'Quantity must be greater than zero.';
		}

		if ($totalProcurementCost === '' || (float) $totalProcurementCost <= 0) {
			$errors['total_procurement_cost'] = 'Total procurement cost must be greater than zero.';
		}

		if ($mode === 'new') {
			if ($itemName === '') {
				$errors['name'] = 'Enter an item name for the new product.';
			}

			if ($category === '' || !in_array($category, $allowedCategories, true)) {
				$errors['category'] = 'Select a valid category for the new product.';
			}

			if ($baseUom === '' || !in_array($baseUom, $allowedUnits, true)) {
				$errors['base_uom'] = 'Select a valid unit of measurement for the new product.';
			}

			if ($weightPerUnit !== '' && (float) $weightPerUnit <= 0) {
				$errors['weight_per_unit'] = 'Weight per unit must be greater than zero.';
			}

			if ($supplierId <= 0) {
				$errors['supplier_id'] = 'Select a supplier for the new item.';
			}

			if ($lowStockThreshold !== '' && (float) $lowStockThreshold < 0) {
				$errors['low_stock_threshold'] = 'Low stock threshold must be zero or greater.';
			}
		}

		if ($mode === 'existing' && $productId <= 0) {
			$errors['product_id'] = 'Choose an existing item before saving stock.';
		}

		if ($errors !== []) {
			$this->jsonResponse([
				'success' => false,
				'errors' => $errors,
			], 422);
		}

		try {
			$pdo->beginTransaction();

			if ($mode === 'existing') {
				$productRecord = $product->findProductById($productId);

				if ($productRecord === null) {
					throw new DomainException('The selected item no longer exists.');
				}

				$category = $category !== '' ? $category : (string) ($productRecord['category'] ?? '');
				$baseUom = $baseUom !== '' ? $baseUom : (string) ($productRecord['base_uom'] ?? '');
				$weightPerUnit = $weightPerUnit !== '' ? $weightPerUnit : ($productRecord['weight_per_unit'] ?? null);
				$supplierId = $supplierId > 0 ? $supplierId : (int) ($productRecord['default_supplier_id'] ?? 0);

				if ($category === '' || !in_array($category, $allowedCategories, true)) {
					throw new DomainException('The selected item category is invalid.');
				}

				if ($baseUom === '' || !in_array($baseUom, $allowedUnits, true)) {
					throw new DomainException('The selected item unit is invalid.');
				}

				if ($supplierId <= 0) {
					throw new DomainException('Select a supplier before saving stock.');
				}

				if ($category !== (string) ($productRecord['category'] ?? '') || $baseUom !== (string) ($productRecord['base_uom'] ?? '')) {
					$product->updateProductCatalog($productId, $category, $baseUom);
				}

				if ($imagePath !== null) {
					$product->updateProductImage($productId, $imagePath);
				}
			} else {
				if ($product->productNameExists($itemName)) {
					throw new DomainException('That item name already exists.');
				}

				$skuCode = $this->generateSkuCode($product);

				if ($product->skuCodeExists($skuCode)) {
					throw new DomainException('Unable to generate a unique SKU. Please try again.');
				}

				$productId = $product->createProduct($skuCode, $itemName, $category, $baseUom, $weightPerUnit, '0.00', $imagePath, $lowStockThreshold);
			}

			$batchCode = $this->generateBatchCode($product);

			if ($product->batchCodeExists($batchCode)) {
				throw new DomainException('Unable to generate a unique batch code. Please try again.');
			}

			$product->insertBatch(
				$productId,
				$supplierId,
				$userId,
				$batchCode,
				$totalProcurementCost,
				$quantityReceived
			);
			$product->incrementProductStock($productId, $quantityReceived, $totalProcurementCost);

			$pdo->commit();

			$auditLog = new AuditLog($pdo);
			$productName = $mode === 'new' ? $itemName : ($productRecord['name'] ?? 'product');
			$auditLog->log(
				$userId,
				'stock_in',
				"Added {$quantityReceived} {$baseUom} of {$productName} (Batch: {$batchCode})",
				$_SERVER['REMOTE_ADDR'] ?? null
			);

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

	/**
	 * Handle stock-out/dispatch request.
	 *
	 * @return void
	 */
	public function dispatch(): void
	{
		if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
			$this->jsonResponse([
				'success' => false,
				'message' => 'Method not allowed.',
			], 405);
		}

		$userId = (int) ($_SESSION['user']['user_id'] ?? 0);
		if ($userId <= 0) {
			$this->jsonResponse([
				'success' => false,
				'message' => 'You must be signed in to dispatch items.',
			], 401);
		}

		$pdo = app_db();
		$product = new Product($pdo);

		$customerReference = isset($_POST['customer_reference']) ? trim((string) $_POST['customer_reference']) : null;
		$itemsJson = $_POST['items'] ?? '[]';

		$errors = [];

		if ($customerReference !== null && $customerReference === '') {
			$customerReference = null;
		}

		$items = json_decode($itemsJson, true);
		if (!is_array($items) || $items === []) {
			$errors['items'] = 'Select at least one product to dispatch.';
		}

		if ($errors !== []) {
			$this->jsonResponse([
				'success' => false,
				'errors' => $errors,
			], 422);
		}

		try {
			$pdo->beginTransaction();

			$dispatchId = $product->createDispatch($userId, $customerReference);

			$totalQuantityDispatched = 0;
			$itemsDispatched = 0;

			foreach ($items as $item) {
				$productId = isset($item['product_id']) ? (int) $item['product_id'] : 0;
				$quantity = isset($item['quantity']) ? (float) $item['quantity'] : 0;
				$dispatchUom = isset($item['dispatch_uom']) ? trim((string) $item['dispatch_uom']) : 'piece';

				$allowedDispatchUoms = ['piece', 'kilo', 'roll'];
				if (!in_array($dispatchUom, $allowedDispatchUoms, true)) {
					$dispatchUom = 'piece';
				}

				if ($productId <= 0 || $quantity <= 0) {
					continue;
				}

				$productRecord = $product->findProductById($productId);
				if ($productRecord === null) {
					throw new DomainException('Product not found.');
				}

				$category = (string) ($productRecord['category'] ?? '');
				$checkQuantity = $quantity;
				if ($category === 'twines' && $dispatchUom === 'kilo') {
					$checkQuantity = $quantity / 20.0;
				}

				$currentStock = (float) ($productRecord['current_quantity'] ?? 0);
				if ($currentStock < $checkQuantity) {
					throw new DomainException('Insufficient stock for ' . ($productRecord['name'] ?? 'product') . '. Available: ' . $currentStock);
				}

				$deductedItems = $product->deductFromBatches($productId, $quantity, $dispatchId, $userId, $dispatchUom, $category);

				if ($deductedItems === 0) {
					throw new DomainException('No available batches for ' . ($productRecord['name'] ?? 'product') . '.');
				}

				$totalQuantityDispatched += $quantity;
				$itemsDispatched += 1;
			}

			if ($itemsDispatched === 0) {
				throw new DomainException('No valid items to dispatch.');
			}

			$pdo->commit();

			$auditLog = new AuditLog($pdo);
			$refText = $customerReference ? " (Ref: {$customerReference})" : '';
			$auditLog->log(
				$userId,
				'stock_out',
				"Dispatched {$totalQuantityDispatched} units across {$itemsDispatched} product(s){$refText}",
				$_SERVER['REMOTE_ADDR'] ?? null
			);

			$this->jsonResponse([
				'success' => true,
				'message' => 'Dispatch completed successfully.',
				'data' => [
					'dispatch_id' => $dispatchId,
					'items_dispatched' => $itemsDispatched,
					'total_quantity' => $totalQuantityDispatched,
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
				'message' => 'Unable to complete dispatch right now. Please try again.',
			], 422);
		}
	}
}
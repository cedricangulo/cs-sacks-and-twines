<?php

declare(strict_types=1);

require_once __DIR__ . '/../../core/db.php';
require_once __DIR__ . '/../../core/uploads.php';
require_once __DIR__ . '/../../models/Product.php';
require_once __DIR__ . '/../../core/audit.php';
require_once __DIR__ . '/../../core/sanitize.php';

/**
 * Handles inventory screens and data loading.
 */
class ProductsController
{

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
		app_json_response($product->allProducts(), 200);
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
		app_json_response($product->getProductsList(), 200);
	}

	/**
	 * Save inventory intake data from the async fetch request.
	 *
	 * @return void
	 */
	public function save(): void
	{
		if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
			app_json_response(
				[
					'success' => false,
					'message' => 'Method not allowed.',
				],
				405
			);
		}

		$userId = (int) ($_SESSION['user']['user_id'] ?? 0);
		if ($userId <= 0) {
			app_json_response(
				[
					'success' => false,
					'message' => 'You must be signed in to save inventory.',
				],
				401
			);
		}

		$pdo = app_db();
		$product = new Product($pdo);
		$mode = strtolower(normalize_text((string) ($_POST['mode'] ?? 'existing')));
		$productId = (int) ($_POST['product_id'] ?? 0);
		$itemName = normalize_text((string) ($_POST['name'] ?? ''));
		$itemName = sanitize_plain_text($itemName);
		$category = normalize_text((string) ($_POST['category'] ?? ''));
		$category = sanitize_plain_text($category);
		$baseUom = normalize_text((string) ($_POST['base_uom'] ?? ''));
		$baseUom = sanitize_plain_text($baseUom);
		$weightPerUnitInput = normalize_text((string) ($_POST['weight_per_unit'] ?? ''));
		$weightPerUnitInput = sanitize_plain_text($weightPerUnitInput);
		$weightPerUnit = $weightPerUnitInput === '' ? 0.0 : (float) $weightPerUnitInput;
		$supplierId = (int) ($_POST['supplier_id'] ?? 0);
		$quantityReceived = normalize_decimal($_POST['quantity_received'] ?? '');
		$totalProcurementCost = normalize_decimal($_POST['total_procurement_cost'] ?? '');
		$lowStockThreshold = normalize_decimal($_POST['low_stock_threshold'] ?? '0');
		$imagePath = null;

		if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
			$imagePath = app_upload_product_image($_FILES['image']);
		}

		$allowedCategories = ['sacks', 'twines'];
		$allowedUnits = ['piece', 'roll'];

		$errors = $this->validateInventoryInput(
			$mode,
			$productId,
			$itemName,
			$category,
			$baseUom,
			$weightPerUnit,
			$supplierId,
			$quantityReceived,
			$totalProcurementCost,
			$lowStockThreshold,
		);

		if ($errors !== []) {
			app_json_response(
				[
					'success' => false,
					'errors' => $errors,
				],
				422
			);
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
				$weightPerUnit = $weightPerUnitInput !== '' ? (float) $weightPerUnitInput : (float) ($productRecord['weight_per_unit'] ?? 0);
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

			$productName = $mode === 'new' ? $itemName : ($productRecord['name'] ?? 'product');
			app_audit_log('stock_in', 'product', $productId, [
				'product_name' => $productName,
				'quantity' => (float) $quantityReceived,
				'uom' => $baseUom,
				'batch_code' => $batchCode,
				'resource_type' => 'product',
				'resource_id' => $productId,
			]);

			app_json_response(
				[
					'success' => true,
					'message' => $mode === 'new' ? 'New item saved successfully.' : 'Stock saved successfully.',
					'data' => [
						'product_id' => $productId,
						'batch_code' => $batchCode,
					],
				],
				200
			);
		} catch (InvalidArgumentException | DomainException $throwable) {
			if ($pdo->inTransaction()) {
				$pdo->rollBack();
			}

			app_json_response(
				[
					'success' => false,
					'message' => $throwable->getMessage(),
				],
				422
			);
		} catch (Throwable $throwable) {
			if ($pdo->inTransaction()) {
				$pdo->rollBack();
			}

			app_json_response(
				[
					'success' => false,
					'message' => 'Unable to save inventory right now. Please try again.',
				],
				422
			);
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
			app_json_response(
				[
					'success' => false,
					'message' => 'Method not allowed.',
				],
				405
			);
		}

		$userId = (int) ($_SESSION['user']['user_id'] ?? 0);
		if ($userId <= 0) {
			app_json_response(
				[
					'success' => false,
					'message' => 'You must be signed in to dispatch items.',
				],
				401
			);
		}

		$pdo = app_db();
		$product = new Product($pdo);

		$customerReference = isset($_POST['customer_reference']) ? trim((string) $_POST['customer_reference']) : null;
		$customerReference = $customerReference !== null ? sanitize_plain_text($customerReference) : null;
		$itemsJson = $_POST['items'] ?? '[]';

		$errors = $this->validateDispatchInput($customerReference, $itemsJson);

		if ($errors !== []) {
			app_json_response(
				[
					'success' => false,
					'errors' => $errors,
				],
				422
			);
		}

		$items = json_decode($itemsJson, true);

		if ($customerReference === '') {
			$customerReference = null;
		}

		try {
			$pdo->beginTransaction();

			$dispatchId = $product->createDispatch($userId, $customerReference);

			$totalQuantityDispatched = 0;
			$itemsDispatched = 0;
			$dispatchedProducts = [];

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

				$dispatchedProducts[] = [
					'name' => $productRecord['name'] ?? 'Unknown Product',
					'quantity' => $quantity,
					'uom' => $dispatchUom,
					'category' => $category,
				];
			}

			if ($itemsDispatched === 0) {
				throw new DomainException('No valid items to dispatch.');
			}

			$pdo->commit();

			app_audit_log('stock_out', 'dispatch', $dispatchId, [
				'items_count' => $itemsDispatched,
				'total_quantity' => (float) $totalQuantityDispatched,
				'products' => $dispatchedProducts,
				'customer_reference' => $customerReference ?? '',
				'resource_type' => 'dispatch',
				'resource_id' => $dispatchId,
			]);

			app_json_response(
				[
					'success' => true,
					'message' => 'Dispatch completed successfully.',
					'data' => [
						'dispatch_id' => $dispatchId,
						'items_dispatched' => $itemsDispatched,
						'total_quantity' => $totalQuantityDispatched,
					],
				],
				200
			);
		} catch (InvalidArgumentException | DomainException $throwable) {
			if ($pdo->inTransaction()) {
				$pdo->rollBack();
			}

			app_json_response(
				[
					'success' => false,
					'message' => $throwable->getMessage(),
				],
				422
			);
		} catch (Throwable $throwable) {
			if ($pdo->inTransaction()) {
				$pdo->rollBack();
			}

			app_json_response(
				[
					'success' => false,
					'message' => 'Unable to complete dispatch right now. Please try again.',
				],
				422
			);
		}
	}

	/**
	 * Validate inventory input data and return an array of errors if any.
	 * 
	 * Validation rules:
	 * 1. Mode must be either 'existing' or 'new'.
	 * 2. For 'existing' mode, product_id must be a positive integer.
	 * 3. For 'new' mode, item name is required and must be unique.
	 * 4. Category must be one of the allowed categories.
	 * 5. Base unit of measurement must be one of the allowed units.
	 * 6. Weight per unit, if provided, must be greater than zero.
	 * 7. Supplier ID must be a positive integer.
	 * 8. Quantity received must be greater than zero.
	 * 9. Total procurement cost must be greater than zero.
	 * 10. Low stock threshold, if provided, must be zero or greater.
	 * 
	 * @param string $mode
	 * @param int $productId
	 * @param string $itemName
	 * @param string $category
	 * @param string $baseUom
	 * @param float $weightPerUnit
	 * @param int $supplierId
	 * @param string $quantityReceived
	 * @param string $totalProcurementCost
	 * @param string $lowStockThreshold
	 * @return array<string, string>
	 */
	private function validateInventoryInput(
		string $mode,
		int $productId,
		string $itemName,
		string $category,
		string $baseUom,
		float $weightPerUnit,
		int $supplierId,
		string $quantityReceived,
		string $totalProcurementCost,
		string $lowStockThreshold,
	): array {
		$errors = [];
		$allowedCategories = ['sacks', 'twines'];
		$allowedUnits = ['piece', 'roll'];

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

			if ($category === 'twines' && $weightPerUnit < 0) {
				$errors['weight_per_unit'] = 'Weight per unit must be zero or greater.';
			}

			if ($category === 'sacks' && $weightPerUnit < 0) {
				$errors['weight_per_unit'] = 'Weight per unit must be zero or greater.';
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

		return $errors;
	}

	/**
	 * Validate dispatch input data and return an array of errors if any.
	 *
	 * @param string|null $customerReference
	 * @param string $itemsJson
	 * @return array<string, string>
	 */
	private function validateDispatchInput(?string $customerReference, string $itemsJson): array {
		$errors = [];

		$items = json_decode($itemsJson, true);
		if (!is_array($items) || $items === []) {
			$errors['items'] = 'Select at least one product to dispatch.';
		}

		return $errors;
	}
}

<?php

declare(strict_types=1);

require_once __DIR__ . '/../../core/db.php';
require_once __DIR__ . '/../../core/uploads.php';
require_once __DIR__ . '/../../core/sanitize.php';
require_once __DIR__ . '/../../models/Product.php';
require_once __DIR__ . '/../../models/Batch.php';
require_once __DIR__ . '/../../core/audit.php';
require_once __DIR__ . '/../../models/Suppliers.php';

/**
 * Handles batch data requests.
 */
class BatchController
{
	private const ALLOWED_CATEGORIES = ['sacks', 'twines'];
	private const ALLOWED_UNITS = ['piece', 'roll'];

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
			app_json_response(
				[
					'success' => false,
					'message' => 'A valid product ID is required.',
				],
				400
			);
		}

		$limit = max(1, min(50, (int) ($_GET['limit'] ?? 3)));
		$offset = max(0, (int) ($_GET['offset'] ?? 0));

		$product = new Product(app_db());
		$batches = $product->batchesByProductId($productId, $limit, $offset);

		app_json_response(
			[
				'success' => true,
				'batches' => $batches,
			],
			200
		);
	}

	/**
	 * Return batches for dispatch (FIFO order).
	 *
	 * @return void
	 */
	public function getBatchesForDispatchJson(): void
	{
		header('Cache-Control: public, max-age=300');
		header('Expires: ' . gmdate('D, d M Y H:i:s T', time() + 300));

		$productId = (int) ($_GET['product_id'] ?? 0);

		if ($productId <= 0) {
			app_json_response(
				[
					'success' => false,
					'message' => 'A valid product ID is required.',
				],
				400
			);
		}

		$product = new Product(app_db());
		$batches = $product->getBatchesForDispatch($productId);

		app_json_response(
			[
				'success' => true,
				'batches' => $batches,
			],
			200
		);
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
			app_json_response(
				[
					'success' => false,
					'message' => 'A valid product ID is required.',
				],
				400
			);
		}

		$product = new Product(app_db());
		$count = $product->batchCountByProductId($productId);

		app_json_response(
			[
				'success' => true,
				'count' => $count,
			],
			200
		);
	}

	/**
	 * Return a single batch with product and supplier context.
	 *
	 * @return void
	 */
	public function getBatchJson(): void
	{
		header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
		header('Pragma: no-cache');
		header('Expires: ' . gmdate('D, d M Y H:i:s T', time() - 3600));

		$batchId = (int) ($_GET['batch_id'] ?? 0);

		if ($batchId <= 0) {
			app_json_response(
				[
					'success' => false,
					'message' => 'A valid batch ID is required.'
				],
				400
			);
		}

		$pdo = app_db();
		$product = new Product($pdo);
		$batch = $product->findBatchById($batchId);

		if ($batch === null) {
			app_json_response(
				[
					'success' => false,
					'message' => 'Batch not found.'
				],
				404
			);
		}

		$batchModel = new Batch($pdo);
		$batch['dispatch_count'] = $batchModel->countDispatchItems($batchId);
		$batch['active_adjustment_count'] = $batchModel->countActiveAdjustments($batchId);
		$batch['can_edit_quantities'] = $batch['dispatch_count'] === 0 && $batch['active_adjustment_count'] === 0;

		app_json_response(
			[
				'success' => true,
				'batch' => $batch
			],
			200
		);
	}

	/**
	 * Require a signed-in user for mutating requests.
	 *
	 * @return int
	 */
	private function requireSignedInUserId(): int
	{
		$userId = (int) ($_SESSION['user']['user_id'] ?? 0);

		if ($userId <= 0) {
			app_json_response(
				[
					'success' => false,
					'message' => 'You must be signed in to perform this action.'
				],
				401
			);
		}

		return $userId;
	}

	/**
	 * Update a batch record and adjust derived product fields when necessary.
	 *
	 * @return void
	 */
	public function updateBatchJson(): void
	{
		if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
			app_json_response(
				[
					'success' => false,
					'message' => 'Method not allowed.'
				],
				405
			);
		}

		$userId = $this->requireSignedInUserId();

		$batchId = (int) ($_POST['batch_id'] ?? 0);
		if ($batchId <= 0) {
			app_json_response(
				[
					'success' => false,
					'message' => 'Select a valid batch.'
				],
				422
			);
		}

		$pdo = app_db();

		try {
			$product = new Product($pdo);
			$batch = $product->findBatchById($batchId);

			if (!$batch) {
				app_json_response(
					[
						'success' => false,
						'message' => 'Batch not found.'
					],
					404
				);
			}

			if (($batch['status'] ?? '') !== 'active') {
				app_json_response(
					[
						'success' => false,
						'message' => 'Only active batches may be edited.'
					],
					422
				);
			}

			$productId = (int) $batch['product_id'];
			$oldQuantityReceived = (float) $batch['quantity_received'];
			$oldQuantityRemaining = (float) $batch['quantity_remaining'];
			$oldTotalCost = (float) $batch['total_procurement_cost'];
			$oldSupplierId = (int) $batch['supplier_id'];
			$oldCategory = (string) ($batch['category'] ?? '');
			$oldBaseUom = (string) ($batch['base_uom'] ?? '');
			$oldWeight = $batch['weight_per_unit'] ?? null;
			$oldLowStock = $batch['low_stock_threshold'] ?? null;
			$oldImagePath = isset($batch['image_path']) ? (string) $batch['image_path'] : null;
			$oldName = (string) ($batch['product_name'] ?? '');
			$oldStatus = (string) ($batch['status'] ?? 'active');

			// Parse inputs
			$newName = normalize_text($_POST['name'] ?? $oldName);
			$newName = sanitize_plain_text($newName);
			$newCategory = normalize_text($_POST['category'] ?? $oldCategory);
			$newCategory = sanitize_plain_text($newCategory);
			$newBaseUom = normalize_text($_POST['base_uom'] ?? $oldBaseUom);
			$newBaseUom = sanitize_plain_text($newBaseUom);
			$newWeightPerUnit = normalize_decimal($_POST['weight_per_unit'] ?? ($oldWeight ?? ''));
			$newLowStockThreshold = normalize_decimal($_POST['low_stock_threshold'] ?? ($oldLowStock ?? '0'));
			$newSupplierId = (int) ($_POST['supplier_id'] ?? $oldSupplierId);
			$newQuantityReceived = normalize_decimal($_POST['quantity_received'] ?? (string) $oldQuantityReceived);
			$newTotalCost = isset($_POST['total_procurement_cost']) ? (float) $_POST['total_procurement_cost'] : $oldTotalCost;
			$newImagePath = $oldImagePath;

			if (isset($_FILES['image']) && ($_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
				$uploaded = app_upload_product_image($_FILES['image']);
				if ($uploaded !== null) {
					$newImagePath = $uploaded;
				}
			}

			$errors = $this->validateBatchUpdate(
				$newName,
				$newCategory,
				$newBaseUom,
				$newWeightPerUnit,
				$newLowStockThreshold,
				$newSupplierId,
				$newQuantityReceived,
				$newTotalCost,
				$batch,
			);

			if ($errors !== []) {
				app_json_response(
					[
						'success' => false,
						'errors' => $errors
					],
					422
				);
			}

			$batchModel = new Batch($pdo);
			$hasDispatches = $batchModel->hasDispatches($batchId);
			$hasActiveAdjustments = $batchModel->hasActiveAdjustments($batchId);
			$hasQuantityHistory = $hasDispatches || $hasActiveAdjustments;

			$newQuantityRemaining = (float) $newQuantityReceived;

			$inventoryFieldsChanged = (
				$newQuantityReceived !== (string) $oldQuantityReceived
				|| $newTotalCost !== $oldTotalCost
			);

			if ($hasQuantityHistory && $inventoryFieldsChanged) {
				app_json_response(
					[
						'success' => false,
						'message' => 'Cannot change inventory quantities for a batch that already has dispatches or active adjustments.',
					],
					422
				);
			}

			$quantityDelta = $newQuantityRemaining - $oldQuantityRemaining;
			$costDelta = $newTotalCost - $oldTotalCost;
			$newUnitCost = ((float) $newQuantityReceived > 0) ? ((float) $newTotalCost / (float) $newQuantityReceived) : 0.0;
			$newBatchStatus = $newQuantityRemaining <= 0 ? 'depleted' : $oldStatus;

			$pdo->beginTransaction();

			$productUpdate = [
				'category' => $newCategory !== $oldCategory ? $newCategory : null,
				'base_uom' => $newBaseUom !== $oldBaseUom ? $newBaseUom : null,
				'weight_per_unit' => $newWeightPerUnit !== (string) ($oldWeight ?? '') ? $newWeightPerUnit : null,
				'low_stock_threshold' => $newLowStockThreshold !== (string) ($oldLowStock ?? '') ? $newLowStockThreshold : null,
				'image_path' => $newImagePath !== $oldImagePath ? $newImagePath : null,
			];

			if (
				$productUpdate['category'] !== null ||
				$productUpdate['base_uom'] !== null ||
				$productUpdate['weight_per_unit'] !== null ||
				$productUpdate['low_stock_threshold'] !== null ||
				$productUpdate['image_path'] !== null
			) {
				$product->updateProductFields($productId, $productUpdate);
			}

			if ($inventoryFieldsChanged) {
				$batchModel->updateInventoryFields(
					$batchId,
					$newSupplierId,
					(string) $newTotalCost,
					(string) $newUnitCost,
					(string) $newQuantityReceived,
					(string) $newQuantityRemaining,
					$newBatchStatus,
				);
			}

			if ($quantityDelta !== 0.0 || $costDelta !== 0.0) {
				$product->adjustProductInventory($productId, $quantityDelta, $costDelta);
			}

			$suppliers = new Suppliers($pdo);
			$supplierList = $suppliers->getAll();
			$supplierMap = array_column($supplierList, 'company_name', 'supplier_id');
			$oldSupplierName = $supplierMap[$oldSupplierId] ?? (string) $oldSupplierId;
			$newSupplierName = $supplierMap[$newSupplierId] ?? (string) $newSupplierId;

			$changes = [];

			if ($oldSupplierId !== $newSupplierId) {
				$changes['supplier_id'] = ['old' => $oldSupplierName, 'new' => $newSupplierName];
			}

			if ($oldQuantityReceived !== (float) $newQuantityReceived) {
				$changes['quantity_received'] = ['old' => (float) $oldQuantityReceived, 'new' => (float) $newQuantityReceived];
			}

			if ($oldQuantityRemaining !== (float) $newQuantityRemaining) {
				$changes['quantity_remaining'] = ['old' => (float) $oldQuantityRemaining, 'new' => (float) $newQuantityRemaining];
			}

			if ($oldTotalCost !== (float) $newTotalCost) {
				$changes['total_cost'] = ['old' => (float) $oldTotalCost, 'new' => (float) $newTotalCost];
			}

			app_audit_log('batch_update', 'batch', $batchId, [
				'batch_id' => $batchId,
				'batch_code' => (string) $batch['batch_code'],
				'changes' => $changes,
				'resource_type' => 'batch',
				'resource_id' => $batchId,
			]);

			$pdo->commit();

			app_json_response(
				[
					'success' => true,
					'message' => 'Batch updated.',
					'batch' => $product->findBatchById($batchId),
					'summary' => ['quantity_delta' => $quantityDelta, 'cost_delta' => $costDelta],
				],
				200
			);
		} catch (Throwable $e) {
			if ($pdo->inTransaction()) {
				$pdo->rollBack();
			}
			app_json_response(
				[
					'success' => false,
					'message' => 'Unable to update batch right now.'
				],
				500
			);
		}
	}

	/**
	 * Void a batch with cascade/flag logic (Option B).
	 *
	 * @return void
	 */
	public function voidBatchJson(): void
	{
		if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
			app_json_response(
				[
					'success' => false,
					'message' => 'Method not allowed.'
				],
				405
			);
		}

		$userId = $this->requireSignedInUserId();

		$batchId = (int) ($_POST['batch_id'] ?? 0);
		$reason = sanitize_plain_text(($_POST['reason'] ?? ''));

		$pdo = app_db();
		$product = new Product($pdo);
		$batch = $product->findBatchById($batchId);

		$errors = $this->validateBatchVoid($batchId, $reason, $batch);

		if ($errors !== []) {
			app_json_response(
				[
					'success' => false,
					'message' => reset($errors)
				],
				422
			);
		}

		$productId = (int) $batch['product_id'];
		$qtyRemaining = (float) $batch['quantity_remaining'];
		$batchCost = (float) $batch['total_procurement_cost'];

		// Safety checks
		$batchModel = new Batch($pdo);
		$dispatchCount = $batchModel->countDispatchItems($batchId);
		if ($dispatchCount > 0) {
			app_json_response(
				[
					'success' => false,
					'message' => 'Cannot void a batch that has been used in dispatches.',
					'blockedBy' => 'dispatches',
					'count' => $dispatchCount
				],
				422
			);
		}

		$adjustCount = $batchModel->countActiveAdjustments($batchId);

		try {
			// Proceed with cascade in transaction
			$pdo->beginTransaction();

			// Mark batch voided
			$batchModel->markVoided($batchId);

			// Update product derived fields
			$product->adjustProductInventory($productId, -$qtyRemaining, -$batchCost, true);

			// Void any stock adjustments for this batch (best-effort)
			$voidedAdjustments = $batchModel->voidAdjustments($batchId);

			app_audit_log('batch_void', 'batch', $batchId, [
				'batch_id' => $batchId,
				'batch_code' => (string) $batch['batch_code'],
				'quantity_removed' => (float) $qtyRemaining,
				'cost_removed' => (float) $batchCost,
				'reason' => $reason !== '' ? $reason : 'n/a',
				'resource_type' => 'batch',
				'resource_id' => $batchId,
			]);

			$pdo->commit();

			app_json_response(
				[
					'success' => true,
					'message' => 'Batch voided.',
					'batch' => $product->findBatchById($batchId),
					'summary' => [
						'product_delta' => -$qtyRemaining,
						'asset_delta' => -$batchCost,
						'voided_adjustments' => $voidedAdjustments
					],
				],
				200
			);
		} catch (Throwable $e) {
			if ($pdo->inTransaction()) $pdo->rollBack();
			error_log(sprintf(
				'Batch void failed for batch %d: %s in %s on line %d',
				$batchId,
				$e->getMessage(),
				$e->getFile(),
				$e->getLine()
			));
			app_json_response(
				[
					'success' => false,
					'message' => 'Unable to void batch right now.'
				],
				500
			);
		}
	}

	/**
	 * Validate batch update inputs.
	 *
	 * @param string $newName
	 * @param string $newCategory
	 * @param string $newBaseUom
	 * @param string $newWeightPerUnit
	 * @param string $newLowStockThreshold
	 * @param int $newSupplierId
	 * @param string $newQuantityReceived
	 * @param float $newTotalCost
	 * @param array<string, mixed> $existingBatch
	 * @return array<string, string>
	 */
	private function validateBatchUpdate(
		string $newName,
		string $newCategory,
		string $newBaseUom,
		string $newWeightPerUnit,
		string $newLowStockThreshold,
		int $newSupplierId,
		string $newQuantityReceived,
		float $newTotalCost,
		array $existingBatch,
	): array {
		$errors = [];
		$oldName = (string) ($existingBatch['product_name'] ?? '');

		if ($newName === '' || mb_strlen($newName) > 255) {
			$errors['name'] = 'Enter a valid item name.';
		}
		if ($newName !== $oldName) {
			$errors['name'] = 'Item name is read-only for batch edits.';
		}
		if ($newCategory === '' || !in_array($newCategory, self::ALLOWED_CATEGORIES, true)) {
			$errors['category'] = 'Select a valid category.';
		}
		if ($newBaseUom === '' || !in_array($newBaseUom, self::ALLOWED_UNITS, true)) {
			$errors['base_uom'] = 'Select a valid unit.';
		}
		if ($newSupplierId <= 0) {
			$errors['supplier_id'] = 'Select a valid supplier.';
		}
		if ($newQuantityReceived === '' || (float) $newQuantityReceived <= 0) {
			$errors['quantity_received'] = 'Quantity received must be greater than zero.';
		}
		if ($newTotalCost <= 0) {
			$errors['total_procurement_cost'] = 'Total procurement cost must be greater than zero.';
		}
		if ($newWeightPerUnit !== '' && (float) $newWeightPerUnit < 0) {
			$errors['weight_per_unit'] = 'Weight per unit must be zero or greater.';
		}
		if ($newLowStockThreshold !== '' && (float) $newLowStockThreshold < 0) {
			$errors['low_stock_threshold'] = 'Low stock threshold must be zero or greater.';
		}

		return $errors;
	}

	/**
	 * Validate batch void inputs.
	 *
	 * @param int $batchId
	 * @param string $reason
	 * @param array<string, mixed>|null $batch
	 * @return array<string, string>
	 */
	private function validateBatchVoid(int $batchId, string $reason, ?array $batch): array
	{
		$errors = [];

		if ($batchId <= 0) {
			$errors['batch_id'] = 'Select a valid batch.';
		}

		if ($batch === null) {
			$errors['batch_id'] = 'Batch not found.';
		} elseif (($batch['status'] ?? '') !== 'active') {
			$errors['batch_id'] = 'Only active batches can be voided.';
		}

		if ($reason !== '' && mb_strlen($reason) > 500) {
			$errors['reason'] = 'Void reason must not exceed 500 characters.';
		}

		return $errors;
	}
}

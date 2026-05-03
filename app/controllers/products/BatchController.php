<?php

declare(strict_types=1);

require_once __DIR__ . '/../../core/db.php';
require_once __DIR__ . '/../../core/uploads.php';
require_once __DIR__ . '/../../models/Product.php';
require_once __DIR__ . '/../../models/AuditLog.php';
require_once __DIR__ . '/../../models/Suppliers.php';

/**
 * Handles batch data requests.
 */
class BatchController
{
	private const ALLOWED_CATEGORIES = ['sacks', 'twines'];
	private const ALLOWED_UNITS = ['piece', 'roll'];

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

		$product = new Product(app_db());
		$batches = $product->batchesByProductId($productId, $limit, $offset);

		$this->jsonResponse([
			'success' => true,
			'batches' => $batches,
		], 200);
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
			$this->jsonResponse([
				'success' => false,
				'message' => 'A valid product ID is required.',
			], 400);
		}

		$product = new Product(app_db());
		$batches = $product->getBatchesForDispatch($productId);

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

		$product = new Product(app_db());
		$count = $product->batchCountByProductId($productId);

		$this->jsonResponse([
			'success' => true,
			'count' => $count,
		], 200);
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
			$this->jsonResponse(['success' => false, 'message' => 'A valid batch ID is required.'], 400);
		}

		$pdo = app_db();
		$product = new Product($pdo);
		$batch = $product->findBatchById($batchId);

		if ($batch === null) {
			$this->jsonResponse(['success' => false, 'message' => 'Batch not found.'], 404);
		}

		$dispatchCheck = $pdo->prepare('SELECT COUNT(*) FROM dispatch_items WHERE batch_id = :batch_id');
		$dispatchCheck->execute(['batch_id' => $batchId]);
		$adjustCheck = $pdo->prepare('SELECT COUNT(*) FROM stock_adjustments WHERE batch_id = :batch_id AND status = :status');
		$adjustCheck->execute(['batch_id' => $batchId, 'status' => 'applied']);

		$batch['dispatch_count'] = (int) $dispatchCheck->fetchColumn();
		$batch['active_adjustment_count'] = (int) $adjustCheck->fetchColumn();
		$batch['can_edit_quantities'] = $batch['dispatch_count'] === 0 && $batch['active_adjustment_count'] === 0;

		$this->jsonResponse(['success' => true, 'batch' => $batch], 200);
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
			$this->jsonResponse(['success' => false, 'message' => 'You must be signed in to perform this action.'], 401);
		}

		return $userId;
	}

	/**
	 * Normalize an input value into a decimal string or empty string.
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
	 * Normalize text input.
	 *
	 * @param mixed $value
	 * @return string
	 */
	private function normalizeText($value): string
	{
		$text = trim((string) $value);
		$text = preg_replace('/\s+/', ' ', $text);

		return $text ?? '';
	}

	/**
	 * Update a batch record and adjust derived product fields when necessary.
	 *
	 * @return void
	 */
	public function updateBatchJson(): void
	{
		if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
			$this->jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
		}

		$userId = $this->requireSignedInUserId();

		$batchId = (int) ($_POST['batch_id'] ?? 0);
		if ($batchId <= 0) {
			$this->jsonResponse(['success' => false, 'message' => 'Select a valid batch.'], 422);
		}

		$pdo = app_db();

		try {
			$product = new Product($pdo);
			$batch = $product->findBatchById($batchId);

			if (!$batch) {
				$this->jsonResponse(['success' => false, 'message' => 'Batch not found.'], 404);
			}

			if (($batch['status'] ?? '') !== 'active') {
				$this->jsonResponse(['success' => false, 'message' => 'Only active batches may be edited.'], 422);
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
			$newName = $this->normalizeText($_POST['name'] ?? $oldName);
			$newCategory = $this->normalizeText($_POST['category'] ?? $oldCategory);
			$newBaseUom = $this->normalizeText($_POST['base_uom'] ?? $oldBaseUom);
			$newWeightPerUnit = $this->normalizeDecimal($_POST['weight_per_unit'] ?? ($oldWeight ?? ''));
			$newLowStockThreshold = $this->normalizeDecimal($_POST['low_stock_threshold'] ?? ($oldLowStock ?? '0'));
			$newSupplierId = (int) ($_POST['supplier_id'] ?? $oldSupplierId);
			$newQuantityReceived = $this->normalizeDecimal($_POST['quantity_received'] ?? (string) $oldQuantityReceived);
			$newTotalCost = isset($_POST['total_procurement_cost']) ? (float) $_POST['total_procurement_cost'] : $oldTotalCost;
			$newImagePath = $oldImagePath;

			if (isset($_FILES['image']) && ($_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
				$uploaded = app_upload_product_image($_FILES['image']);
				if ($uploaded !== null) {
					$newImagePath = $uploaded;
				}
			}

			$errors = [];

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
			if ($newTotalCost === '' || (float) $newTotalCost <= 0) {
				$errors['total_procurement_cost'] = 'Total procurement cost must be greater than zero.';
			}
			if ($newWeightPerUnit !== '' && (float) $newWeightPerUnit < 0) {
				$errors['weight_per_unit'] = 'Weight per unit must be zero or greater.';
			}
			if ($newLowStockThreshold !== '' && (float) $newLowStockThreshold < 0) {
				$errors['low_stock_threshold'] = 'Low stock threshold must be zero or greater.';
			}
			if ($errors !== []) {
				$this->jsonResponse(['success' => false, 'errors' => $errors], 422);
			}

			$dispatchCheck = $pdo->prepare('SELECT 1 FROM dispatch_items WHERE batch_id = :batch_id LIMIT 1');
			$dispatchCheck->execute(['batch_id' => $batchId]);
			$hasDispatches = $dispatchCheck->fetchColumn() !== false;

			$adjustCheck = $pdo->prepare('SELECT 1 FROM stock_adjustments WHERE batch_id = :batch_id AND status = :status LIMIT 1');
			$adjustCheck->execute(['batch_id' => $batchId, 'status' => 'applied']);
			$hasActiveAdjustments = $adjustCheck->fetchColumn() !== false;
			$hasQuantityHistory = $hasDispatches || $hasActiveAdjustments;

			$newQuantityRemaining = (float) $newQuantityReceived;

			$inventoryFieldsChanged = (
				$newQuantityReceived !== (string) $oldQuantityReceived
				|| $newTotalCost !== $oldTotalCost
			);

			if ($hasQuantityHistory && $inventoryFieldsChanged) {
				$this->jsonResponse([
					'success' => false,
					'message' => 'Cannot change inventory quantities for a batch that already has dispatches or active adjustments.',
				], 422);
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
			if ($productUpdate['category'] !== null || $productUpdate['base_uom'] !== null || $productUpdate['weight_per_unit'] !== null || $productUpdate['low_stock_threshold'] !== null || $productUpdate['image_path'] !== null) {
				$product->updateProductFields($productId, $productUpdate);
			}

			if ($inventoryFieldsChanged) {
				$batchUpdate = $pdo->prepare(
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
				$batchUpdate->execute([
					'supplier_id' => $newSupplierId,
					'total_procurement_cost' => (string) $newTotalCost,
					'unit_cost' => (string) $newUnitCost,
					'quantity_received' => (string) $newQuantityReceived,
					'quantity_remaining' => (string) $newQuantityRemaining,
					'status' => $newBatchStatus,
					'batch_id' => $batchId,
				]);
			}

			if ($quantityDelta !== 0.0 || $costDelta !== 0.0) {
				$productStmt = $pdo->prepare('SELECT current_quantity, total_asset_value FROM products WHERE product_id = :product_id LIMIT 1');
				$productStmt->execute(['product_id' => $productId]);
				$productRecord = $productStmt->fetch();
				if (!$productRecord) {
					throw new RuntimeException('Associated product not found.');
				}

				$newProductQty = (float) $productRecord['current_quantity'] + $quantityDelta;
				$newProductAsset = (float) $productRecord['total_asset_value'] + $costDelta;

				if ($newProductQty < 0 || $newProductAsset < 0) {
					throw new RuntimeException('Resulting product totals would be negative.');
				}

				$productAdjust = $pdo->prepare('UPDATE products SET current_quantity = :current_quantity, total_asset_value = :asset_value, updated_at = CURRENT_TIMESTAMP WHERE product_id = :product_id');
				$productAdjust->execute([
					'current_quantity' => (string) $newProductQty,
					'asset_value' => (string) $newProductAsset,
					'product_id' => $productId,
				]);
			}

			// Create audit log
			$audit = new AuditLog($pdo);
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
			$audit->log($userId, 'batch_update', json_encode([
				'batch_id' => $batchId,
				'batch_code' => (string) $batch['batch_code'],
				'changes' => $changes,
				'resource_type' => 'batch',
				'resource_id' => $batchId,
			]), $_SERVER['REMOTE_ADDR'] ?? null, $_SERVER['HTTP_USER_AGENT'] ?? null);

			$pdo->commit();

			$this->jsonResponse([
				'success' => true,
				'message' => 'Batch updated.',
				'batch' => $product->findBatchById($batchId),
				'summary' => ['quantity_delta' => $quantityDelta, 'cost_delta' => $costDelta],
			], 200);
		} catch (Throwable $e) {
			if ($pdo->inTransaction()) {
				$pdo->rollBack();
			}
			$this->jsonResponse(['success' => false, 'message' => 'Unable to update batch right now.'], 500);
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
			$this->jsonResponse(['success' => false, 'message' => 'Method not allowed.'], 405);
		}

		$userId = $this->requireSignedInUserId();

		$batchId = (int) ($_POST['batch_id'] ?? 0);
		$reason = trim((string) ($_POST['reason'] ?? ''));
		if ($batchId <= 0) {
			$this->jsonResponse(['success' => false, 'message' => 'Select a valid batch.'], 422);
		}

		$pdo = app_db();

		try {
			$product = new Product($pdo);
			$productModel = $product;
			$batch = $product->findBatchById($batchId);

			if (!$batch) {
				$this->jsonResponse(['success' => false, 'message' => 'Batch not found.'], 404);
			}

			if (($batch['status'] ?? '') !== 'active') {
				$this->jsonResponse(['success' => false, 'message' => 'Only active batches can be voided.'], 422);
			}

			$productId = (int) $batch['product_id'];
			$qtyRemaining = (float) $batch['quantity_remaining'];
			$batchCost = (float) $batch['total_procurement_cost'];

			// Safety checks
			$dispatchCheck = $pdo->prepare('SELECT COUNT(*) FROM dispatch_items WHERE batch_id = :batch_id');
			$dispatchCheck->execute(['batch_id' => $batchId]);
			$dispatchCount = (int) $dispatchCheck->fetchColumn();
			if ($dispatchCount > 0) {
				$this->jsonResponse(['success' => false, 'message' => 'Cannot void a batch that has been used in dispatches.', 'blockedBy' => 'dispatches', 'count' => $dispatchCount], 422);
			}

			$adjustCheck = $pdo->prepare('SELECT COUNT(*) FROM stock_adjustments WHERE batch_id = :batch_id AND status = "applied"');
			$adjustCheck->execute(['batch_id' => $batchId]);
			$adjustCount = (int) $adjustCheck->fetchColumn();

			// Proceed with cascade in transaction
			$pdo->beginTransaction();

			// Mark batch voided
			$upd = $pdo->prepare('UPDATE batches SET status = "voided", updated_at = CURRENT_TIMESTAMP WHERE batch_id = :batch_id');
			$upd->execute(['batch_id' => $batchId]);

			// Update product derived fields
			$prodStm = $pdo->prepare('SELECT current_quantity, total_asset_value FROM products WHERE product_id = :product_id LIMIT 1');
			$prodStm->execute(['product_id' => $productId]);
			$productRow = $prodStm->fetch();
			if (!$productRow) {
				$pdo->rollBack();
				$this->jsonResponse(['success' => false, 'message' => 'Associated product not found.'], 404);
			}

			$newQty = (float) $productRow['current_quantity'] - $qtyRemaining;
			$newAsset = (float) $productRow['total_asset_value'] - $batchCost;

			if ($newQty < 0) $newQty = 0.0;
			if ($newAsset < 0) $newAsset = 0.0;

			$prodUpd = $pdo->prepare('UPDATE products SET current_quantity = :current_quantity, total_asset_value = :asset_value, updated_at = CURRENT_TIMESTAMP WHERE product_id = :product_id');
			$prodUpd->execute(['current_quantity' => (string) $newQty, 'asset_value' => (string) $newAsset, 'product_id' => $productId]);

			// Void any stock adjustments for this batch (best-effort)
			$voidAdj = $pdo->prepare('UPDATE stock_adjustments SET status = "voided", updated_at = CURRENT_TIMESTAMP WHERE batch_id = :batch_id AND status = "applied"');
			$voidAdj->execute(['batch_id' => $batchId]);
			$voidedAdjustments = $voidAdj->rowCount();

			// Audit log
			$audit = new AuditLog($pdo);
			$audit->log($userId, 'batch_void', json_encode([
				'batch_id' => $batchId,
				'batch_code' => (string) $batch['batch_code'],
				'quantity_removed' => (float) $qtyRemaining,
				'cost_removed' => (float) $batchCost,
				'reason' => $reason !== '' ? $reason : 'n/a',
				'resource_type' => 'batch',
				'resource_id' => $batchId,
			]), $_SERVER['REMOTE_ADDR'] ?? null);

			$pdo->commit();

			$this->jsonResponse([
				'success' => true,
				'message' => 'Batch voided.',
				'batch' => $product->findBatchById($batchId),
				'summary' => ['product_delta' => -$qtyRemaining, 'asset_delta' => -$batchCost, 'voided_adjustments' => $voidedAdjustments],
			], 200);
		} catch (Throwable $e) {
			if ($pdo->inTransaction()) $pdo->rollBack();
			error_log(sprintf('Batch void failed for batch %d: %s in %s on line %d', $batchId, $e->getMessage(), $e->getFile(), $e->getLine()));
			$this->jsonResponse(['success' => false, 'message' => 'Unable to void batch right now.'], 500);
		}
	}
}
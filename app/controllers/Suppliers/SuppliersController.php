<?php

declare(strict_types=1);

require_once __DIR__ . '/../../core/db.php';
require_once __DIR__ . '/../../core/audit.php';
require_once __DIR__ . '/../../models/Suppliers.php';
require_once __DIR__ . '/../../core/sanitize.php';

class SuppliersController
{
  private Suppliers $suppliers;

  public function __construct()
  {
    $this->suppliers = new Suppliers(app_db());
  }

  /**
   * Handle the request to show the suppliers list.
   *
   * @return void
   */
  public function index(): void
  {
    $suppliersList = $this->suppliers->getAll();
    include __DIR__ . '/../../views/suppliers/index.php';
  }

  /**
   * Return all suppliers as JSON for the async fetch API.
   *
   * @return void
   */
  public function getSuppliersJson(): void
  {
    header('Cache-Control: public, max-age=300');
    header('Expires: ' . gmdate('D, d M Y H:i:s T', time() + 300));
    
    $suppliers = $this->suppliers->getAll();
    
    app_json_response($suppliers, 200);
  }

  /**
   * Save a supplier record from the async form.
   *
   * @return void
   */
  public function save(): void
  {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
      app_json_response([
        'success' => false,
        'message' => 'Method not allowed.',
      ], 405);
    }

    // Normalize and sanitize inputs
    $companyName = normalize_text($_POST['company_name'] ?? '');
    $contactPerson = normalize_text($_POST['contact_person'] ?? '');
    $contactNumber = normalize_text($_POST['contact_number'] ?? '');
    $address = normalize_text($_POST['address'] ?? '');

    // Sanitize after normalization to preserve spacing but remove tags and control characters
    $companyName = sanitize_plain_text($companyName);
    $contactPerson = sanitize_plain_text($contactPerson);
    $contactNumber = sanitize_plain_text($contactNumber);
    $address = sanitize_plain_text($address);

    $errors = $this->validateSupplier($companyName, $contactPerson, $contactNumber, $address);
    if ($errors !== []) {
      app_json_response([
        'success' => false,
        'errors' => $errors,
      ], 422);
    }

    if ($this->suppliers->companyExists($companyName)) {
      app_json_response([
        'success' => false,
        'errors' => [
          'company_name' => 'That supplier already exists.',
        ],
      ], 409);
    }

    try {
      $supplierId = $this->suppliers->create($companyName, $contactPerson, $contactNumber, $address);

      app_audit_log('supplier_create', 'supplier', $supplierId, [
        'company_name' => $companyName,
        'contact_person' => $contactPerson,
        'resource_type' => 'supplier',
        'resource_id' => $supplierId,
      ]);

      app_json_response([
        'success' => true,
        'message' => 'Supplier saved successfully.',
        'data' => [
          'id' => $supplierId,
        ],
      ], 201);
    } catch (Throwable $throwable) {
      app_json_response([
        'success' => false,
        'message' => 'Unable to save supplier right now. Please try again.',
      ], 500);
    }
  }

  /**
   * Validate supplier inputs.
   *
   * @param string $companyName
   * @param string $contactPerson
   * @param string $contactNumber
   * @param string $address
   * @return array<string, string>
   */
  private function validateSupplier(string $companyName, string $contactPerson, string $contactNumber, string $address): array
  {
    $errors = [];

    if ($companyName === '' || mb_strlen($companyName) < 2 || mb_strlen($companyName) > 255) {
      $errors['company_name'] = 'Enter a valid company name.';
    }

    if ($contactPerson === '' || mb_strlen($contactPerson) < 2 || mb_strlen($contactPerson) > 255) {
      $errors['contact_person'] = 'Enter a valid contact person name.';
    }

    // Remove non-digit characters for validation but keep original for storage
    $contactNumberDigits = preg_replace('/\D/', '', $contactNumber);

    // PH mobile: 10 digits starting with 9, optionally prefixed with 0 or 63
    $isMobile = preg_match('/^(09|639)\d{9}$/', $contactNumberDigits);

    // PH landline: 7-8 digits, optionally prefixed with 0 and area code (1-2 digits)
    $isLandline = preg_match('/^(0\d{1,2}|63\d{1,2})\d{7}$/', $contactNumberDigits);

    if ($contactNumberDigits === '' || (!$isMobile && !$isLandline)) {
      $errors['contact_number'] = 'Please enter a valid PH mobile (e.g., 0917...) or landline number.';
    }

    if ($address === '' || mb_strlen($address) < 10 || mb_strlen($address) > 500) {
      $errors['address'] = 'Enter a valid address.';
    }

    return $errors;
  }

  /**
   * Return a single supplier as JSON.
   *
   * @return void
   */
  public function show(): void
  {
    $supplierId = (int) ($_GET['id'] ?? 0);

    if ($supplierId <= 0) {
      app_json_response([
        'success' => false,
        'message' => 'Supplier not found.',
      ], 404);
    }

    $supplier = $this->suppliers->getById($supplierId);

    if ($supplier === false) {
      app_json_response([
        'success' => false,
        'message' => 'Supplier not found.',
      ], 404);
    }

    $batches = $this->suppliers->getBatches($supplierId);
    $batchCount = count($batches);
    $relatedBatches = $batchCount > 0 ? array_map(fn($batch) => [
      'batch' => $batch['batch_code'],
      'product' => $batch['name'],
      'qty' => (int) $batch['quantity_received'],
    ], $batches) : null;

    app_json_response([
      'success' => true,
      'data' => $supplier,
      'batch_count' => $batchCount,
      'related_batches' => $relatedBatches,
    ], 200);
  }

  /**
   * Update a supplier record.
   *
   * @return void
   */
  public function update(): void
  {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
      app_json_response([
        'success' => false,
        'message' => 'Method not allowed.',
      ], 405);
    }

    $supplierId = (int) ($_POST['id'] ?? 0);

    if ($supplierId <= 0) {
      app_json_response([
        'success' => false,
        'message' => 'Supplier not found.',
      ], 404);
    }

    $existing = $this->suppliers->getById($supplierId);
    if ($existing === false) {
      app_json_response([
        'success' => false,
        'message' => 'Supplier not found.',
      ], 404);
    }

    // Normalize and sanitize inputs
    $companyName = normalize_text($_POST['company_name'] ?? '');
    $contactPerson = normalize_text($_POST['contact_person'] ?? '');
    $contactNumber = normalize_text($_POST['contact_number'] ?? '');
    $address = normalize_text($_POST['address'] ?? '');

    // Sanitize after normalization to preserve spacing but remove tags and control characters
    $companyName = sanitize_plain_text($companyName);
    $contactPerson = sanitize_plain_text($contactPerson);
    $contactNumber = sanitize_plain_text($contactNumber);
    $address = sanitize_plain_text($address);

    $errors = $this->validateSupplier($companyName, $contactPerson, $contactNumber, $address);
    if ($errors !== []) {
      app_json_response([
        'success' => false,
        'errors' => $errors,
      ], 422);
    }

    // Check if company name changed and if it already exists for another supplier
    if ($companyName !== $existing['company_name'] && $this->suppliers->companyExists($companyName)) {
      app_json_response([
        'success' => false,
        'errors' => [
          'company_name' => 'That supplier already exists.',
        ],
      ], 409);
    }

    try {
      $changes = [];

      if ($companyName !== (string) $existing['company_name']) {
        $changes['company_name'] = ['old' => (string) $existing['company_name'], 'new' => $companyName];
      }

      if ($contactPerson !== (string) $existing['contact_person']) {
        $changes['contact_person'] = ['old' => (string) $existing['contact_person'], 'new' => $contactPerson];
      }

      if ($contactNumber !== (string) $existing['contact_number']) {
        $changes['contact_number'] = ['old' => (string) $existing['contact_number'], 'new' => $contactNumber];
      }

      if ($address !== (string) $existing['address']) {
        $changes['address'] = ['old' => (string) $existing['address'], 'new' => $address];
      }

      $this->suppliers->update($supplierId, $companyName, $contactPerson, $contactNumber, $address);

      app_audit_log('supplier_update', 'supplier', $supplierId, [
        'company_name' => $companyName,
        'contact_person' => $contactPerson,
        'changes' => $changes,
        'resource_type' => 'supplier',
        'resource_id' => $supplierId,
      ]);

      app_json_response([
        'success' => true,
        'message' => 'Supplier updated successfully.',
      ], 200);
    } catch (Throwable $throwable) {
      app_json_response([
        'success' => false,
        'message' => 'Unable to update supplier right now. Please try again.',
      ], 500);
    }
  }

  /**
   * Delete a supplier record.
   *
   * @return void
   */
  public function delete(): void
  {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
      app_json_response([
        'success' => false,
        'message' => 'Method not allowed.',
      ], 405);
    }

    $supplierId = (int) ($_POST['id'] ?? 0);

    if ($supplierId <= 0) {
      app_json_response([
        'success' => false,
        'message' => 'Supplier not found.',
      ], 404);
    }

    $existing = $this->suppliers->getById($supplierId);
    if ($existing === false) {
      app_json_response([
        'success' => false,
        'message' => 'Supplier not found.',
      ], 404);
    }

    // Check for related batches first
    $batches = $this->suppliers->getBatches($supplierId);

    if ([] !== $batches) {
      $batchDetails = array_map(fn($batch) => [
        'batch' => $batch['batch_code'],
        'product' => $batch['name'],
        'qty' => (int) $batch['quantity_received'],
      ], $batches);

      app_json_response([
        'success' => false,
        'error' => 'Cannot delete supplier. They still have ' . count($batches) . ' batch(es):',
        'details' => $batchDetails,
      ], 422);
    }

    try {
      $companyName = $existing['company_name'];
      $this->suppliers->delete($supplierId);

      app_audit_log('supplier_delete', 'supplier', $supplierId, [
        'company_name' => $companyName,
        'resource_type' => 'supplier',
        'resource_id' => $supplierId,
      ]);

      app_json_response([
        'success' => true,
        'message' => 'Supplier deleted successfully.',
      ], 200);
    } catch (Throwable $throwable) {
      app_json_response([
        'success' => false,
        'message' => 'Unable to delete supplier right now. Please try again.',
      ], 500);
    }
  }
}

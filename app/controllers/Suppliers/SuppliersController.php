<?php

declare(strict_types=1);

require_once __DIR__ . '/../../core/db.php';
require_once __DIR__ . '/../../models/Suppliers.php';

class SuppliersController
{
  private Suppliers $suppliers;

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
    
    $this->jsonResponse($suppliers, 200);
  }

  /**
   * Save a supplier record from the async form.
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

    $companyName = $this->normalizeText($_POST['company_name'] ?? '');
    $contactPerson = $this->normalizeText($_POST['contact_person'] ?? '');
    $contactNumber = $this->normalizeText($_POST['contact_number'] ?? '');
    $address = $this->normalizeText($_POST['address'] ?? '');

    $companyName = $this->sanitizePlainText($companyName);
    $contactPerson = $this->sanitizePlainText($contactPerson);
    $contactNumber = $this->sanitizePlainText($contactNumber);
    $address = $this->sanitizePlainText($address);

    $errors = $this->validateSupplier($companyName, $contactPerson, $contactNumber, $address);
    if ($errors !== []) {
      $this->jsonResponse([
        'success' => false,
        'errors' => $errors,
      ], 422);
    }

    if ($this->suppliers->companyExists($companyName)) {
      $this->jsonResponse([
        'success' => false,
        'errors' => [
          'company_name' => 'That supplier already exists.',
        ],
      ], 409);
    }

    try {
      $supplierId = $this->suppliers->create($companyName, $contactPerson, $contactNumber, $address);

      $this->jsonResponse([
        'success' => true,
        'message' => 'Supplier saved successfully.',
        'data' => [
          'id' => $supplierId,
        ],
      ], 201);
    } catch (Throwable $throwable) {
      $this->jsonResponse([
        'success' => false,
        'message' => 'Unable to save supplier right now. Please try again.',
      ], 500);
    }
  }

  /**
   * Normalize input text by trimming and collapsing whitespace.
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
   * Strip tags and control characters from input.
   *
   * @param string $value
   * @return string
   */
  private function sanitizePlainText(string $value): string
  {
    $cleaned = strip_tags($value);
    $cleaned = preg_replace('/[\x00-\x1F\x7F]/u', '', $cleaned);

    return $cleaned ?? '';
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

    if ($contactNumber === '' || mb_strlen($contactNumber) < 7 || mb_strlen($contactNumber) > 20) {
      $errors['contact_number'] = 'Enter a valid contact number.';
    }

    if (!preg_match('/^[0-9+()\s-]{7,20}$/', $contactNumber)) {
      $errors['contact_number'] = 'Contact number may contain only digits, spaces, +, -, and parentheses.';
    }

    if ($address === '' || mb_strlen($address) < 10 || mb_strlen($address) > 500) {
      $errors['address'] = 'Enter a valid address.';
    }

    return $errors;
  }
}

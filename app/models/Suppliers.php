<?php

declare(strict_types=1);

class Suppliers
{
  private PDO $pdo;

  /**
   * Initialize the Auth model with a database connection.
   *
   * @param PDO $pdo The active database connection instance
   */
  public function __construct(PDO $pdo)
  {
    $this->pdo = $pdo;
  }

  /**
   * Retrieve all suppliers from the database.
   *
   * @return array An array of supplier records
   */
  public function getAll(): array
  {
    $statement = $this->pdo->query(
      'SELECT supplier_id, company_name, contact_person, contact_number, address, created_at, updated_at FROM suppliers ORDER BY company_name ASC'
    );
    return $statement->fetchAll();
  }

  /**
   * Check whether a supplier already exists for the company name.
   *
   * @param string $companyName
   * @return bool
   */
  public function companyExists(string $companyName): bool
  {
    $statement = $this->pdo->prepare('SELECT 1 FROM suppliers WHERE LOWER(company_name) = LOWER(:company_name) LIMIT 1');
    $statement->execute(['company_name' => $companyName]);

    return $statement->fetchColumn() !== false;
  }

/**
   * Create a new supplier record.
   *
   * @param string $companyName
   * @param string $contactPerson
   * @param string $contactNumber
   * @param string $address
   * @return int
   */
  public function create(string $companyName, string $contactPerson, string $contactNumber, string $address): int
  {
    $statement = $this->pdo->prepare(
      'INSERT INTO suppliers (company_name, contact_person, contact_number, address)
       VALUES (:company_name, :contact_person, :contact_number, :address)'
    );
    $statement->execute([
      'company_name' => $companyName,
      'contact_person' => $contactPerson,
      'contact_number' => $contactNumber,
      'address' => $address,
    ]);

    return (int) $this->pdo->lastInsertId();
  }

  /**
   * Retrieve a single supplier by ID.
   *
   * @param int $supplierId
   * @return array<string, mixed>|false
   */
  public function getById(int $supplierId): array|false
  {
    $statement = $this->pdo->prepare(
      'SELECT supplier_id, company_name, contact_person, contact_number, address, created_at, updated_at FROM suppliers WHERE supplier_id = :supplier_id'
    );
    $statement->execute(['supplier_id' => $supplierId]);
    $result = $statement->fetch();

    return $result ?: false;
  }

  /**
   * Update an existing supplier record.
   *
   * @param int $supplierId
   * @param string $companyName
   * @param string $contactPerson
   * @param string $contactNumber
   * @param string $address
   * @return bool
   */
  public function update(int $supplierId, string $companyName, string $contactPerson, string $contactNumber, string $address): bool
  {
    $statement = $this->pdo->prepare(
      'UPDATE suppliers SET company_name = :company_name, contact_person = :contact_person, contact_number = :contact_number, address = :address WHERE supplier_id = :supplier_id'
    );
    $statement->execute([
      'supplier_id' => $supplierId,
      'company_name' => $companyName,
      'contact_person' => $contactPerson,
      'contact_number' => $contactNumber,
      'address' => $address,
    ]);

    return $statement->rowCount() > 0;
  }

  /**
   * Delete a supplier record.
   *
   * @param int $supplierId
   * @return bool
   */
  public function delete(int $supplierId): bool
  {
    $statement = $this->pdo->prepare('DELETE FROM suppliers WHERE supplier_id = :supplier_id');
    $statement->execute(['supplier_id' => $supplierId]);

    return $statement->rowCount() > 0;
  }

  /**
   * Get all batches associated with a supplier.
   *
   * @param int $supplierId
   * @return array<int, array<string, mixed>>
   */
  public function getBatches(int $supplierId): array
  {
    $statement = $this->pdo->prepare(
      "SELECT b.batch_id, b.batch_code, p.name, b.quantity_received
       FROM batches b
       JOIN products p ON b.product_id = p.product_id
       WHERE b.supplier_id = :supplier_id
       ORDER BY b.created_at DESC"
    );
    $statement->execute(['supplier_id' => $supplierId]);

    return $statement->fetchAll();
  }
}

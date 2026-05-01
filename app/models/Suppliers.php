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
}

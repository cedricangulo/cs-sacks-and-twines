<?php

declare(strict_types=1);

class Users
{
  private PDO $pdo;

  /**
   * Initialize the Users model with a database connection.
   *
   * @param PDO $pdo The active database connection instance
   */
  public function __construct(PDO $pdo)
  {
    $this->pdo = $pdo;
  }

  /**
   * Retrieve all active users from the database.
   *
   * @return array<int, array<string, mixed>>
   */
  public function getAllActive(): array
  {
    $statement = $this->pdo->query(
      'SELECT user_id, name, email, role, created_at, updated_at
        FROM users
        WHERE role = \'staff\'
        ORDER BY name ASC'
    );

    return $statement->fetchAll();
  }

  /**
   * Check whether a user already exists for the email address.
   *
   * @param string $email
   * @param int|null $excludeId
   * @return bool
   */
  public function emailExists(string $email, ?int $excludeId = null): bool
  {
    $sql = 'SELECT 1 FROM users WHERE LOWER(email) = LOWER(:email)';
    $params = ['email' => $email];

    if ($excludeId !== null) {
      $sql .= ' AND user_id != :exclude_id';
      $params['exclude_id'] = $excludeId;
    }

    $sql .= ' LIMIT 1';

    $statement = $this->pdo->prepare($sql);
    $statement->execute($params);

    return $statement->fetchColumn() !== false;
  }

  /**
   * Create a new user record.
   *
   * @param string $name
   * @param string $email
   * @param string $passwordHash
   * @param string $role
   * @return int
   */
  public function create(string $name, string $email, string $passwordHash, string $role): int
  {
    $statement = $this->pdo->prepare(
      'INSERT INTO users (name, email, password_hash, role)
       VALUES (:name, :email, :password_hash, :role)'
    );
    $statement->execute([
      'name' => $name,
      'email' => $email,
      'password_hash' => $passwordHash,
      'role' => $role,
    ]);

    return (int) $this->pdo->lastInsertId();
  }

  /**
   * Deactivate a user by setting archived_at.
   *
   * @param int $userId
   * @return bool
   */
  public function deactivate(int $userId): bool
  {
    $statement = $this->pdo->prepare(
      'DELETE FROM users WHERE user_id = :id'
    );
    $statement->execute([
      'id' => $userId,
    ]);

    return $statement->rowCount() > 0;
  }

  /**
   * Check if user is a staff member (not owner).
   *
   * @param int $userId
   * @return bool
   */
  public function isStaff(int $userId): bool
  {
    $statement = $this->pdo->prepare(
      'SELECT role FROM users WHERE user_id = :user_id LIMIT 1'
    );
    $statement->execute(['user_id' => $userId]);
    $user = $statement->fetch();

    return $user && ($user['role'] ?? '') === 'staff';
  }
}

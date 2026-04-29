<?php

declare(strict_types=1);

/**
 * Auth Model
 *
 * Encapsulates the credential lookup and verification steps so the
 * controller stays focused on request flow and redirects.
 */
class Auth
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
   * Find a user record by their email address.
   *
   * @param string $email The email address to look up
   * @return array|null The user record array, or null if not found
   */
  public function findUserByEmail(string $email): ?array
  {
    // Parameter binding keeps the lookup safe from SQL injection.
    $statement = $this->pdo->prepare(
      'SELECT id, name, email, password, role FROM users WHERE email = :email LIMIT 1'
    );

    $statement->execute(['email' => $email]);
    $user = $statement->fetch();

    if ($user === false) {
      return null;
    }

    return $user;
  }

  /**
   * Attempt to sign a user in with an email and password.
   * Returns the user data without the password if successful.
   *
   * @param string $email The email address attempting to sign in
   * @param string $password The raw password to verify
   * @return array|null The verified user record minus password, or null on failure
   */
  public function attemptSignIn(string $email, string $password): ?array
  {
    // Return null for both missing users and bad passwords so the caller can
    // show one generic error message.
    $user = $this->findUserByEmail($email);

    if ($user === null) {
      return null;
    }

    if (!password_verify($password, (string) $user['password'])) {
      return null;
    }

    unset($user['password']);

    return $user;
  }
}

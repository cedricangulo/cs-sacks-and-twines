<?php

// Auth encapsulates the credential lookup and verification steps so the
// controller stays focused on request flow and redirects.
class Auth
{
  private PDO $pdo;

  public function __construct(PDO $pdo)
  {
    $this->pdo = $pdo;
  }

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
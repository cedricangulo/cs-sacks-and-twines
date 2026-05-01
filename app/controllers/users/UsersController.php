<?php

declare(strict_types=1);

require_once __DIR__ . '/../../core/db.php';
require_once __DIR__ . '/../../models/Users.php';

class UsersController
{
  private Users $users;

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
    $this->users = new Users(app_db());
  }

  /**
   * Return all active staff as JSON.
   *
   * @return void
   */
  public function getUsersJson(): void
  {
    header('Cache-Control: public, max-age=300');
    header('Expires: ' . gmdate('D, d M Y H:i:s T', time() + 300));

    $users = $this->users->getAllActive();

    $this->jsonResponse($users, 200);
  }

  /**
   * Save a new user record.
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

    $name = $this->normalizeText($_POST['name'] ?? '');
    $email = $this->normalizeText($_POST['email'] ?? '');
    $role = 'staff';
    $password = $this->normalizePassword($_POST['password'] ?? '');

    $name = $this->sanitizePlainText($name);
    $email = $this->sanitizePlainText($email);
    $password = $this->sanitizePassword($password);

    $errors = $this->validateNewUser($name, $email, $role, $password);
    if ($errors !== []) {
      $this->jsonResponse([
        'success' => false,
        'errors' => $errors,
      ], 422);
    }

    if ($this->users->emailExists($email)) {
      $this->jsonResponse([
        'success' => false,
        'errors' => [
          'email' => 'That email address is already in use.',
        ],
      ], 409);
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    try {
      $userId = $this->users->create($name, $email, $passwordHash, $role);

      $this->jsonResponse([
        'success' => true,
        'message' => 'Staff saved successfully.',
        'data' => [
          'id' => $userId,
        ],
      ], 201);
    } catch (Throwable $throwable) {
      $this->jsonResponse([
        'success' => false,
        'message' => 'Unable to save staff right now. Please try again.',
      ], 500);
    }
  }


  /**
   * Deactivate a user (soft delete).
   *
   * @return void
   */
  public function deactivate(): void
  {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
      $this->jsonResponse([
        'success' => false,
        'message' => 'Method not allowed.',
      ], 405);
    }

    $userId = (int) ($_POST['user_id'] ?? 0);
    $currentUserId = (int) ($_SESSION['user']['user_id'] ?? 0);

    if ($userId <= 0) {
      $this->jsonResponse([
        'success' => false,
        'message' => 'Select a valid staff member.',
      ], 422);
    }

    if (!$this->users->isStaff($userId)) {
      $this->jsonResponse([
        'success' => false,
        'message' => 'Cannot deactivate this account.',
      ], 422);
    }

    if ($currentUserId > 0 && $userId === $currentUserId) {
      $this->jsonResponse([
        'success' => false,
        'message' => 'You cannot deactivate your own account.',
      ], 422);
    }

    try {
      $deactivated = $this->users->deactivate($userId);

      if (!$deactivated) {
        $this->jsonResponse([
          'success' => false,
        'message' => 'Staff member not found or already deactivated.',
        ], 404);
      }

      $this->jsonResponse([
        'success' => true,
        'message' => 'Staff member deactivated successfully.',
      ], 200);
    } catch (Throwable $throwable) {
      $this->jsonResponse([
        'success' => false,
        'message' => 'Unable to deactivate staff right now. Please try again.',
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
   * Normalize password input by trimming.
   *
   * @param mixed $value
   * @return string
   */
  private function normalizePassword($value): string
  {
    return trim((string) $value);
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
   * Remove control characters from passwords.
   *
   * @param string $value
   * @return string
   */
  private function sanitizePassword(string $value): string
  {
    $cleaned = preg_replace('/[\x00-\x1F\x7F]/u', '', $value);

    return $cleaned ?? '';
  }

  /**
   * Validate new user inputs.
   *
   * @param string $name
   * @param string $email
   * @param string $role
   * @param string $password
   * @return array<string, string>
   */
  private function validateNewUser(string $name, string $email, string $role, string $password): array
  {
    $errors = [];

    if ($name === '' || mb_strlen($name) < 2 || mb_strlen($name) > 255) {
      $errors['name'] = 'Enter a valid name.';
    }

    if ($email === '' || mb_strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
      $errors['email'] = 'Enter a valid email address.';
    }

    if ($role !== 'staff') {
      $errors['role'] = 'Choose a valid role.';
    }

    if ($password === '' || mb_strlen($password) < 8) {
      $errors['password'] = 'Password must be at least 8 characters.';
    }

    return $errors;
  }

}

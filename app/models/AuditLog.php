<?php

declare(strict_types=1);

/**
 * AuditLog model.
 *
 * Provides logging and read access to audit logs.
 */
class AuditLog
{
	private PDO $pdo;

	public function __construct(PDO $pdo)
	{
		$this->pdo = $pdo;
	}

	/**
	 * Create a new audit log entry.
	 *
	 * @param int $userId
	 * @param string $action
	 * @param string $description
	 * @param string|null $ipAddress
	 * @return int
	 */
	public function log(int $userId, string $action, string $description, ?string $ipAddress = null): int
	{
		$statement = $this->pdo->prepare(
			'INSERT INTO audit_logs (user_id, action, description, ip_address) VALUES (:user_id, :action, :description, :ip_address)'
		);
		$statement->execute([
			'user_id' => $userId,
			'action' => $action,
			'description' => $description,
			'ip_address' => $ipAddress,
		]);

		return (int) $this->pdo->lastInsertId();
	}

	/**
	 * Get all audit logs with pagination.
	 *
	 * @param int $limit
	 * @param int $offset
	 * @return array<int, array<string, mixed>>
	 */
	public function getAll(int $limit = 50, int $offset = 0): array
	{
		$statement = $this->pdo->prepare(
			'SELECT
				al.log_id,
				al.action,
				al.description,
				al.ip_address,
				al.created_at,
				u.name AS user_name,
				u.email AS user_email,
				u.role AS user_role
			FROM audit_logs al
			JOIN users u ON u.user_id = al.user_id
			ORDER BY al.created_at DESC
			LIMIT :limit OFFSET :offset'
		);
		$statement->bindValue('limit', $limit, PDO::PARAM_INT);
		$statement->bindValue('offset', $offset, PDO::PARAM_INT);
		$statement->execute();

		return $statement->fetchAll();
	}

	/**
	 * Get audit logs for a specific user.
	 *
	 * @param int $userId
	 * @param int $limit
	 * @param int $offset
	 * @return array<int, array<string, mixed>>
	 */
	public function getByUserId(int $userId, int $limit = 50, int $offset = 0): array
	{
		$statement = $this->pdo->prepare(
			'SELECT
				al.log_id,
				al.action,
				al.description,
				al.ip_address,
				al.created_at,
				u.name AS user_name,
				u.email AS user_email,
				u.role AS user_role
			FROM audit_logs al
			JOIN users u ON u.user_id = al.user_id
			WHERE al.user_id = :user_id
			ORDER BY al.created_at DESC
			LIMIT :limit OFFSET :offset'
		);
		$statement->bindValue('user_id', $userId, PDO::PARAM_INT);
		$statement->bindValue('limit', $limit, PDO::PARAM_INT);
		$statement->bindValue('offset', $offset, PDO::PARAM_INT);
		$statement->execute();

		return $statement->fetchAll();
	}

	/**
	 * Count total audit logs.
	 *
	 * @return int
	 */
	public function countAll(): int
	{
		$statement = $this->pdo->query('SELECT COUNT(*) FROM audit_logs');

		return (int) $statement->fetchColumn();
	}

	/**
	 * Count audit logs for a specific user.
	 *
	 * @param int $userId
	 * @return int
	 */
	public function countByUserId(int $userId): int
	{
		$statement = $this->pdo->prepare('SELECT COUNT(*) FROM audit_logs WHERE user_id = :user_id');
		$statement->execute(['user_id' => $userId]);

		return (int) $statement->fetchColumn();
	}
}
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
	 * @param int|null $userId
	 * @param string $action
	 * @param string $description
	 * @param string|null $ipAddress
	 * @param string|null $userAgent
	 * @return int
	 */
	public function log(?int $userId, string $action, string $description, ?string $ipAddress = null, ?string $userAgent = null): int
	{
		$statement = $this->pdo->prepare(
			'INSERT INTO audit_logs (user_id, action, description, ip_address, user_agent) VALUES (:user_id, :action, :description, :ip_address, :user_agent)'
		);
		$statement->execute([
			'user_id' => $userId,
			'action' => $action,
			'description' => $description,
			'ip_address' => $ipAddress,
			'user_agent' => $userAgent,
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
				al.user_agent,
				al.created_at,
				u.name AS user_name,
				u.email AS user_email,
				u.role AS user_role
			FROM audit_logs al
			LEFT JOIN users u ON u.user_id = al.user_id
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
				al.user_agent,
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

	/**
	 * Get filtered, sorted, paginated audit logs.
	 *
	 * @param array{search?: string, action?: string, user_id?: int, date_from?: string, date_to?: string, sort?: string, dir?: string, page?: int, limit?: int} $params
	 * @return array{logs: array<int, array<string, mixed>>, pagination: array{page: int, limit: int, total: int, total_pages: int}}
	 */
	public function getFiltered(array $params): array
	{
		$columns = 'al.log_id, al.user_id, al.action, al.description, al.ip_address, al.user_agent, al.created_at, u.name AS user_name, u.email AS user_email, u.role AS user_role';
		$searchColumns = ['al.description', 'u.name', 'u.email'];
		$allowedSortColumns = ['al.created_at', 'al.action', 'al.description', 'u.name', 'u.email'];
		$defaultSort = 'al.created_at';
		$defaultDir = 'DESC';

		$qf = new QueryFilter($this->pdo, 'audit_logs al');
		$qf->leftJoin('users u ON u.user_id = al.user_id');
		$qf->search($params['search'] ?? '', $searchColumns);
		$qf->where('al.action', $params['action'] ?? '');
		$qf->where('al.user_id', isset($params['user_id']) ? (int) $params['user_id'] : null);
		$qf->dateRange('al.created_at', $params['date_from'] ?? null, $params['date_to'] ?? null);
		$qf->sort($defaultSort, $defaultDir, $params['sort'] ?? '', $params['dir'] ?? '', $allowedSortColumns);
		$qf->paginate($params['page'] ?? 1, $params['limit'] ?? 20);

		$logs = $qf->select($columns);
		$pagination = $qf->pagination();

		return [
			'logs' => $logs,
			'pagination' => $pagination,
		];
	}

	/**
	 * Get all unique actions for filter dropdown.
	 *
	 * @return array<string>
	 */
	public function getDistinctActions(): array
	{
		$statement = $this->pdo->query('SELECT DISTINCT action FROM audit_logs ORDER BY action ASC');

		return array_map(static fn($row): string => (string) $row['action'], $statement->fetchAll());
	}

	/**
	 * Get all users who have audit logs (for filter dropdown).
	 *
	 * @return array<int, array{user_id: int, name: string}>
	 */
	public function getUsersWithLogs(): array
	{
		$statement = $this->pdo->query(
			'SELECT DISTINCT u.user_id, u.name
			 FROM audit_logs al
			 JOIN users u ON u.user_id = al.user_id
			 ORDER BY u.name ASC'
		);

		return $statement->fetchAll();
	}
}
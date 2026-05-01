<?php

declare(strict_types=1);

require_once __DIR__ . '/../../core/db.php';
require_once __DIR__ . '/../../models/AuditLog.php';

/**
 * Handles audit logs data requests.
 */
class AuditLogsController
{
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

	/**
	 * Return all audit logs as JSON.
	 *
	 * @return void
	 */
	public function getLogsJson(): void
	{
		$auditLog = new AuditLog(app_db());

		$page = max(1, (int) ($_GET['page'] ?? 1));
		$limit = max(1, min(100, (int) ($_GET['limit'] ?? 50)));
		$offset = ($page - 1) * $limit;

		$logs = $auditLog->getAll($limit, $offset);
		$total = $auditLog->countAll();
		$totalPages = (int) ceil($total / $limit);

		$this->jsonResponse([
			'success' => true,
			'logs' => $logs,
			'pagination' => [
				'page' => $page,
				'limit' => $limit,
				'total' => $total,
				'total_pages' => $totalPages,
			],
		], 200);
	}

	/**
	 * Return personal audit logs (for staff).
	 *
	 * @return void
	 */
	public function getPersonalLogsJson(): void
	{
		$userId = (int) ($_SESSION['user']['user_id'] ?? 0);
		if ($userId <= 0) {
			$this->jsonResponse([
				'success' => false,
				'message' => 'You must be signed in to view audit logs.',
			], 401);
		}

		$auditLog = new AuditLog(app_db());

		$page = max(1, (int) ($_GET['page'] ?? 1));
		$limit = max(1, min(100, (int) ($_GET['limit'] ?? 50)));
		$offset = ($page - 1) * $limit;

		$logs = $auditLog->getByUserId($userId, $limit, $offset);
		$total = $auditLog->countByUserId($userId);
		$totalPages = (int) ceil($total / $limit);

		$this->jsonResponse([
			'success' => true,
			'logs' => $logs,
			'pagination' => [
				'page' => $page,
				'limit' => $limit,
				'total' => $total,
				'total_pages' => $totalPages,
			],
		], 200);
	}
}
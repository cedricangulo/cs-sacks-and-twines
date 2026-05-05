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
	 * Return all audit logs as JSON with filtering, sorting, and pagination.
	 *
	 * @return void
	 */
	public function getLogsJson(): void
	{
		$auditLog = new AuditLog(app_db());

		$params = [
			'search' => trim((string) ($_GET['search'] ?? '')),
			'action' => trim((string) ($_GET['action'] ?? '')),
			'user_id' => isset($_GET['user_id']) && is_numeric($_GET['user_id']) ? (int) $_GET['user_id'] : null,
			'date_from' => trim((string) ($_GET['date_from'] ?? '')),
			'date_to' => trim((string) ($_GET['date_to'] ?? '')),
			'sort' => trim((string) ($_GET['sort'] ?? '')),
			'dir' => strtoupper(trim((string) ($_GET['dir'] ?? ''))),
			'page' => max(1, (int) ($_GET['page'] ?? 1)),
			'limit' => max(1, min(100, (int) ($_GET['limit'] ?? 20))),
		];

		$result = $auditLog->getFiltered($params);
		$filters = [
			'actions' => $auditLog->getDistinctActions(),
			'users' => $auditLog->getUsersWithLogs(),
		];

		$this->jsonResponse([
			'success' => true,
			'logs' => $result['logs'],
			'pagination' => $result['pagination'],
			'filters' => $filters,
		], 200);
	}

	/**
	 * Return personal audit logs (for staff) with filtering and pagination.
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

		$params = [
			'search' => trim((string) ($_GET['search'] ?? '')),
			'action' => trim((string) ($_GET['action'] ?? '')),
			'user_id' => $userId,
			'date_from' => trim((string) ($_GET['date_from'] ?? '')),
			'date_to' => trim((string) ($_GET['date_to'] ?? '')),
			'sort' => trim((string) ($_GET['sort'] ?? '')),
			'dir' => strtoupper(trim((string) ($_GET['dir'] ?? ''))),
			'page' => max(1, (int) ($_GET['page'] ?? 1)),
			'limit' => max(1, min(100, (int) ($_GET['limit'] ?? 20))),
		];

		$result = $auditLog->getFiltered($params);

		$this->jsonResponse([
			'success' => true,
			'logs' => $result['logs'],
			'pagination' => $result['pagination'],
		], 200);
	}

	/**
	 * Export all audit logs (respecting current filters) as a CSV download.
	 *
	 * @return void
	 */
	public function exportCsv(): void
	{
		$userId = (int) ($_SESSION['user']['user_id'] ?? 0);
		if ($userId <= 0) {
			header('Content-Type: application/json; charset=UTF-8');
			http_response_code(401);
			echo json_encode(['success' => false, 'message' => 'You must be signed in to export logs.']);
			exit;
		}

		$auditLog = new AuditLog(app_db());

		$params = [
			'search' => trim((string) ($_GET['search'] ?? '')),
			'action' => trim((string) ($_GET['action'] ?? '')),
			'user_id' => isset($_GET['user_id']) && is_numeric($_GET['user_id']) ? (int) $_GET['user_id'] : null,
			'date_from' => trim((string) ($_GET['date_from'] ?? '')),
			'date_to' => trim((string) ($_GET['date_to'] ?? '')),
			'sort' => 'al.created_at',
			'dir' => 'DESC',
			'page' => 1,
			'limit' => 10000,
		];

		$result = $auditLog->getFiltered($params);

		$filename = 'audit-logs-' . date('Y-m-d') . '.csv';

		header('Content-Type: text/csv; charset=UTF-8');
		header('Content-Disposition: attachment; filename="' . $filename . '"');
		header('Cache-Control: no-cache, no-store, must-revalidate');
		header('Pragma: no-cache');
		header('Expires: 0');

		$output = fopen('php://output', 'w');

		fputs($output, "\xEF\xBB\xBF");

		fputcsv($output, ['Timestamp', 'User', 'Email', 'Role', 'Action', 'Resource Type', 'Resource ID', 'Description', 'IP Address']);

		foreach ($result['logs'] as $log) {
			$description = $log['description'] ?? '';
			$resourceType = '';
			$resourceId = '';
			if ($description !== '') {
				$parsed = json_decode($description, true);
				if (is_array($parsed)) {
					$resourceType = $parsed['resource_type'] ?? '';
					$resourceId = $parsed['resource_id'] ?? '';
				}
			}

			fputcsv($output, [
				$log['created_at'] ?? '',
				$log['user_name'] ?? '',
				$log['user_email'] ?? '',
				$log['user_role'] ?? '',
				$log['action'] ?? '',
				$resourceType,
				$resourceId,
				$description,
				$log['ip_address'] ?? '',
			]);
		}

		fclose($output);
		exit;
	}
}
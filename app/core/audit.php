<?php

declare(strict_types=1);

/**
 * Audit logging helper.
 *
 * Provides a thin wrapper around the AuditLog model so that every call
 * automatically captures the current user ID (if authenticated), IP address,
 * and user agent.  Anonymous events (e.g., failed login attempts) are
 * recorded with a null user_id.
 *
 * Each event is written to both the database and a local JSON Lines file
 * in app/logs/audit/ for dual-record traceability.
 *
 * Usage:
 *   app_audit_log('product_create', 'product', $productId, [
 *       'name' => 'Example Product',
 *       'changes' => ['field' => 'value'],
 *       'reason' => 'Initial import',
 *   ]);
 */
require_once __DIR__ . '/../models/AuditLog.php';

/**
 * Directory where audit log files are stored.
 */
function app_audit_log_dir(): string
{
	$dir = __DIR__ . '/../logs/audit';
	if (!is_dir($dir)) {
		mkdir($dir, 0750, true);
	}
	return $dir;
}

/**
 * Append a single audit event to the current month's JSON Lines file.
 *
 * Files are named audit-YYYY-MM.log and rotate monthly.
 *
 * @param array<string, mixed> $entry
 * @return void
 */
function app_audit_log_to_file(array $entry): void
{
	$filePath = app_audit_log_dir() . '/audit-' . date('Y-m') . '.log';
	$line = json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
	file_put_contents($filePath, $line, FILE_APPEND | LOCK_EX);
}

/**
 * Write an audit log entry for the current request.
 *
 * Logs to both the database and a local file simultaneously.
 *
 * @param string $action       Stable action name, e.g. 'user_create', 'batch_void'.
 * @param string $resourceType High-level entity type, e.g. 'user', 'batch', 'dispatch'.
 * @param int|null $resourceId Primary-key identifier of the affected entity.
 * @param array<string, mixed> $metadata Arbitrary key/value pairs describing the event.
 *                                      Common keys: 'changes', 'reason', 'resource_type',
 *                                      'resource_id'.  Sensitive data (passwords, tokens)
 *                                      must never be passed here.
 * @return int The inserted log_id.
 */
function app_audit_log(string $action, string $resourceType, ?int $resourceId = null, array $metadata = []): int
{
	$userId = (int) ($_SESSION['user']['user_id'] ?? 0);

	// Ensure resource_type and resource_id are always present in the payload.
	$payload = $metadata;
	if (!isset($payload['resource_type'])) {
		$payload['resource_type'] = $resourceType;
	}
	if (!isset($payload['resource_id']) && $resourceId !== null) {
		$payload['resource_id'] = $resourceId;
	}

	$description = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}';
	$ipAddress = $_SERVER['REMOTE_ADDR'] ?? null;
	$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;

	// Write to local file (best-effort; never block the response).
	try {
		app_audit_log_to_file([
			'timestamp' => date('Y-m-d H:i:s'),
			'user_id' => $userId > 0 ? $userId : null,
			'action' => $action,
			'resource_type' => $resourceType,
			'resource_id' => $resourceId,
			'description' => $description,
			'ip_address' => $ipAddress,
			'user_agent' => $userAgent,
		]);
	} catch (Throwable $_) {
		// Silently ignore file write failures — the database log is authoritative.
	}

	// Write to database.
	$auditLog = new AuditLog(app_db());

	return $auditLog->log(
		$userId > 0 ? $userId : null,
		$action,
		$description,
		$ipAddress,
		$userAgent
	);
}

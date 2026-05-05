-- Allow audit_logs to record events without an authenticated user
-- (e.g., failed login attempts, anonymous access).
ALTER TABLE audit_logs MODIFY user_id BIGINT UNSIGNED DEFAULT NULL;

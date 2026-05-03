-- Add user_agent column to audit_logs for better traceability
ALTER TABLE audit_logs ADD COLUMN user_agent VARCHAR(512) DEFAULT NULL AFTER ip_address;
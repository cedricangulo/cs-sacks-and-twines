-- Drop all tables so the schema can be recreated cleanly.
-- Run docs/schema.sql after this script to rebuild the database.

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS dispatch_items;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS dispatches;
DROP TABLE IF EXISTS batches;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

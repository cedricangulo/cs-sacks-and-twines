-- Clear all tables except owner user
-- Run this script to reset the database while keeping the owner account

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM stock_adjustments;
DELETE FROM dispatch_items;
DELETE FROM dispatches;
DELETE FROM batches;
DELETE FROM products;
DELETE FROM suppliers;
DELETE FROM audit_logs;
DELETE FROM users;

-- Reset auto increment IDs
ALTER TABLE stock_adjustments AUTO_INCREMENT = 1;
ALTER TABLE dispatch_items AUTO_INCREMENT = 1;
ALTER TABLE dispatches AUTO_INCREMENT = 1;
ALTER TABLE batches AUTO_INCREMENT = 1;
ALTER TABLE products AUTO_INCREMENT = 1;
ALTER TABLE suppliers AUTO_INCREMENT = 1;
ALTER TABLE audit_logs AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- Re-insert owner account
INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
VALUES ('Michael', 'newmichael@gmail.com', '$2y$10$ACY3dNsDd50N.hE2abORqeCLVIkfDwXFEdjSp4FM4Cyx/I4gTztra', 'owner', NOW(), NOW());
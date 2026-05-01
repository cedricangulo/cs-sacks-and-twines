-- MySQL schema for CS Sacks and Twines
-- Matches the current data dictionary in docs/data-dictionary.md

SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS stock_adjustments;
DROP TABLE IF EXISTS dispatch_items;
DROP TABLE IF EXISTS dispatches;
DROP TABLE IF EXISTS batches;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
    user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('owner', 'staff') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY users_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
    log_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    action VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (log_id),
    KEY audit_logs_user_id_index (user_id),
    CONSTRAINT audit_logs_user_id_foreign
        FOREIGN KEY (user_id) REFERENCES users (user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE suppliers (
    supplier_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) DEFAULT NULL,
    contact_number VARCHAR(50) DEFAULT NULL,
    address VARCHAR(255) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (supplier_id),
    UNIQUE KEY suppliers_company_name_unique (company_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE products (
    product_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    sku_code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category ENUM('sacks', 'twines') NOT NULL,
    base_uom ENUM('piece', 'roll', 'kilo') NOT NULL,
    weight_per_unit DECIMAL(10,4) DEFAULT NULL,
    current_quantity DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_asset_value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    low_stock_threshold DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('active', 'archived') NOT NULL DEFAULT 'active',
    image_path VARCHAR(255) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id),
    UNIQUE KEY products_sku_code_unique (sku_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE batches (
    batch_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    product_id BIGINT UNSIGNED NOT NULL,
    supplier_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    batch_code VARCHAR(100) NOT NULL,
    total_procurement_cost DECIMAL(15,2) NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    quantity_received DECIMAL(10,2) NOT NULL,
    quantity_remaining DECIMAL(10,2) NOT NULL,
    status ENUM('active', 'depleted', 'voided') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (batch_id),
    UNIQUE KEY batches_batch_code_unique (batch_code),
    KEY batches_product_id_index (product_id),
    KEY batches_supplier_id_index (supplier_id),
    KEY batches_user_id_index (user_id),
    CONSTRAINT batches_product_id_foreign
        FOREIGN KEY (product_id) REFERENCES products (product_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT batches_supplier_id_foreign
        FOREIGN KEY (supplier_id) REFERENCES suppliers (supplier_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT batches_user_id_foreign
        FOREIGN KEY (user_id) REFERENCES users (user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE dispatches (
    dispatch_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    customer_reference VARCHAR(255) DEFAULT NULL,
    status ENUM('completed', 'voided') NOT NULL DEFAULT 'completed',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (dispatch_id),
    KEY dispatches_user_id_index (user_id),
    CONSTRAINT dispatches_user_id_foreign
        FOREIGN KEY (user_id) REFERENCES users (user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE dispatch_items (
    dispatch_item_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    dispatch_id BIGINT UNSIGNED NOT NULL,
    batch_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    dispatch_uom ENUM('piece', 'kilo', 'roll') NOT NULL,
    dispatch_quantity DECIMAL(10,2) NOT NULL,
    quantity_deducted DECIMAL(10,4) NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (dispatch_item_id),
    KEY dispatch_items_dispatch_id_index (dispatch_id),
    KEY dispatch_items_batch_id_index (batch_id),
    KEY dispatch_items_product_id_index (product_id),
    CONSTRAINT dispatch_items_dispatch_id_foreign
        FOREIGN KEY (dispatch_id) REFERENCES dispatches (dispatch_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT dispatch_items_batch_id_foreign
        FOREIGN KEY (batch_id) REFERENCES batches (batch_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT dispatch_items_product_id_foreign
        FOREIGN KEY (product_id) REFERENCES products (product_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stock_adjustments (
    adjustment_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    batch_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    quantity_adjusted DECIMAL(10,2) NOT NULL,
    reason ENUM('damaged', 'lost', 'recount', 'system_reversal') NOT NULL,
    status ENUM('applied', 'voided') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (adjustment_id),
    KEY stock_adjustments_batch_id_index (batch_id),
    KEY stock_adjustments_product_id_index (product_id),
    KEY stock_adjustments_user_id_index (user_id),
    CONSTRAINT stock_adjustments_batch_id_foreign
        FOREIGN KEY (batch_id) REFERENCES batches (batch_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT stock_adjustments_product_id_foreign
        FOREIGN KEY (product_id) REFERENCES products (product_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT stock_adjustments_user_id_foreign
        FOREIGN KEY (user_id) REFERENCES users (user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SET NAMES utf8mb4;

ALTER TABLE products
  ADD COLUMN weight_per_unit DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER base_uom,
  ADD COLUMN total_asset_value DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER current_stock,
  ADD COLUMN status ENUM('active', 'inactive') NOT NULL DEFAULT 'active' AFTER total_asset_value,
  ADD COLUMN image_path VARCHAR(500) DEFAULT NULL AFTER status;

ALTER TABLE batches
  ADD COLUMN total_procurement_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER batch_code,
  ADD COLUMN status ENUM('pending', 'received', 'depleted', 'cancelled') NOT NULL DEFAULT 'received' AFTER quantity_remaining;

ALTER TABLE dispatches
  ADD COLUMN status ENUM('draft', 'completed', 'cancelled') NOT NULL DEFAULT 'draft' AFTER customer_reference;

ALTER TABLE dispatch_items
  ADD COLUMN dispatch_uom ENUM('pieces', 'kilos') NOT NULL DEFAULT 'pieces' AFTER product_id,
  ADD COLUMN dispatch_quantity DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER dispatch_uom,
  ADD COLUMN unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER dispatch_quantity;

CREATE TABLE IF NOT EXISTS stock_adjustments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    batch_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    quantity_adjusted DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    reason ENUM('damage', 'shrinkage', 'correction', 'expiry', 'other') NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'applied') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY stock_adjustments_batch_id_index (batch_id),
    KEY stock_adjustments_product_id_index (product_id),
    KEY stock_adjustments_user_id_index (user_id),
    CONSTRAINT stock_adjustments_batch_id_foreign
        FOREIGN KEY (batch_id) REFERENCES batches (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT stock_adjustments_product_id_foreign
        FOREIGN KEY (product_id) REFERENCES products (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT stock_adjustments_user_id_foreign
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
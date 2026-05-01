-- Make weight_per_unit nullable in products table
-- Also migrate existing 0.0000 values to NULL

ALTER TABLE products
MODIFY COLUMN weight_per_unit DECIMAL(10,4) DEFAULT NULL;

UPDATE products
SET weight_per_unit = NULL
WHERE weight_per_unit = 0.0000;
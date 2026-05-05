### 1. USERS
Contains records of individuals authorized to use the system.

| Field Name        | Data Type | MySQL Type / Size      | Key  | Description                             |
| :---------------- | :-------- | :--------------------- | :--- | :-------------------------------------- |
| **user_id**       | BigInt    | BIGINT UNSIGNED        | PK   | Unique ID ng user.                      |
| **name**          | String    | VARCHAR(255)           | -    | Buong pangalan ng owner o staff.        |
| **email**         | String    | VARCHAR(255)           | UK   | Unique email para sa login.             |
| **password_hash** | String    | VARCHAR(255)           | -    | Hashed password (Bcrypt).               |
| **role**          | Enum      | ENUM('owner', 'staff') | -    | Values: 'owner', 'staff'                |
| **created_at**    | Timestamp | DATETIME               | -    | Timestamp kung kailan ginawa.           |
| **updated_at**    | Timestamp | DATETIME               | -    | Timestamp kung kailan huling in-update. |

---

### 2. AUDIT_LOGS
Records all movements and actions within the system.

| Field Name      | Data Type | MySQL Type / Size | Key  | Description                                          |
| :-------------- | :-------- | :---------------- | :--- | :--------------------------------------------------- |
| **log_id**      | BigInt    | BIGINT UNSIGNED   | PK   | Unique ID ng log.                                    |
| **user_id**     | BigInt    | BIGINT UNSIGNED   | FK   | Nakakonekta sa USERS (Sino ang gumawa).              |
| **action**      | String    | VARCHAR(255)      | -    | Maikling title ng action (e.g., "Created Dispatch"). |
| **description** | Text      | TEXT              | -    | Buong detalye ng ginawa ng user.                     |
| **ip_address**  | String    | VARCHAR(45)       | -    | IP Address ng device na ginamit.                     |
| **user_agent**  | String    | VARCHAR(512)      | -    | User agent string ng browser/device na ginamit.      |
| **created_at**  | Timestamp | DATETIME          | -    |                                                      |
| **updated_at**  | Timestamp | DATETIME          | -    |                                                      |

---

### 3. SUPPLIERS
A list of sources for sacks and twine.

| Field Name         | Data Type | MySQL Type / Size | Key  | Description                      |
| :----------------- | :-------- | :---------------- | :--- | :------------------------------- |
| **supplier_id**    | BigInt    | BIGINT UNSIGNED   | PK   | Unique ID ng supplier.           |
| **company_name**   | String    | VARCHAR(255)      | -    | Pangalan ng kumpanya o supplier. |
| **contact_person** | String    | VARCHAR(255)      | -    | Pangalan ng kausap.              |
| **contact_number** | String    | VARCHAR(50)       | -    | Phone/Mobile number.             |
| **address**        | String    | VARCHAR(255)      | -    | Address ng supplier.             |
| **created_at**     | Timestamp | DATETIME          | -    |                                  |
| **updated_at**     | Timestamp | DATETIME          | -    |                                  |

---

### 4. PRODUCTS
Master list of all types of sacks and twine.

| Field Name              | Data Type | MySQL Type / Size          | Key  | Description                                    |
| :---------------------- | :-------- | :------------------------- | :--- | :--------------------------------------------- |
| **product_id**          | BigInt    | BIGINT UNSIGNED            | PK   | Unique ID ng product.                          |
| **sku_code**            | String    | VARCHAR(100)               | UK   | Unique Barcode/SKU ng item.                    |
| **name**                | String    | VARCHAR(255)               | -    | Pangalan ng product (e.g., "Red Sack 50kg").   |
| **category**            | Enum      | ENUM('sacks', 'twines')    | -    | Values: 'sacks', 'twines'                      |
| **base_uom**            | Enum      | ENUM('piece', 'roll')      | -    | Unit of Measurement sa bodega.                 |
| **weight_per_unit**     | Decimal   | DECIMAL(10,4)              | -    | Ilang kilo ang bigat ng isang piece/roll.      |
| **current_quantity**    | Decimal   | DECIMAL(10,2)              | -    | (Derived) Total na natitirang stock.           |
| **total_asset_value**   | Decimal   | DECIMAL(15,2)              | -    | (Derived) Total na halaga ng natitirang stock. |
| **low_stock_threshold** | Decimal   | DECIMAL(10,2)              | -    | Pang low stock alert                           |
| **status**              | Enum      | ENUM('active', 'archived') | -    | Values: 'active', 'archived'                   |
| **image_path**          | String    | VARCHAR(255)               | -    | File name ng image.                            |
| **created_at**          | Timestamp | DATETIME                   | -    |                                                |
| **updated_at**          | Timestamp | DATETIME                   | -    |                                                |

---

### 5. BATCHES
Records of deliveries and stock-in from suppliers.

| Field Name                 | Data Type | MySQL Type / Size                    | Key  | Description                            |
| :------------------------- | :-------- | :----------------------------------- | :--- | :------------------------------------- |
| **batch_id**               | BigInt    | BIGINT UNSIGNED                      | PK   | Unique ID ng delivery batch.           |
| **product_id**             | BigInt    | BIGINT UNSIGNED                      | FK   | Nakakonekta sa PRODUCTS.               |
| **supplier_id**            | BigInt    | BIGINT UNSIGNED                      | FK   | Nakakonekta sa SUPPLIERS.              |
| **user_id**                | BigInt    | BIGINT UNSIGNED                      | FK   | Nakakonekta sa USERS.                  |
| **batch_code**             | String    | VARCHAR(100)                         | UK   | Receipt # galing sa supplier.          |
| **total_procurement_cost** | Decimal   | DECIMAL(15,2)                        | -    | Magkano binayaran sa buong batch.      |
| **unit_cost**              | Decimal   | DECIMAL(10,2)                        | -    | Puhunan kada isang piraso o roll.      |
| **quantity_received**      | Decimal   | DECIMAL(10,2)                        | -    | Original na bilang na dumating.        |
| **quantity_remaining**     | Decimal   | DECIMAL(10,2)                        | -    | Bilang ng natitira sa batch na ito.    |
| **status**                 | Enum      | ENUM('active', 'depleted', 'voided') | -    | Values: 'active', 'depleted', 'voided' |
| **created_at**             | Timestamp | DATETIME                             | -    |                                        |
| **updated_at**             | Timestamp | DATETIME                             | -    |                                        |

---

### 6. DISPATCHES
Transaction logs for stock outgoing (receipts).

| Field Name             | Data Type | MySQL Type / Size           | Key  | Description                          |
| :--------------------- | :-------- | :-------------------------- | :--- | :----------------------------------- |
| **dispatch_id**        | BigInt    | BIGINT UNSIGNED             | PK   | Unique ID ng transaksyon/resibo.     |
| **user_id**            | BigInt    | BIGINT UNSIGNED             | FK   | Nakakonekta sa USERS.                |
| **customer_reference** | String    | VARCHAR(255)                | -    | Pangalan ng bumili o plaka ng truck. |
| **status**             | Enum      | ENUM('completed', 'voided') | -    | Values: 'completed', 'voided'        |
| **created_at**         | Timestamp | DATETIME                    | -    |                                      |
| **updated_at**         | Timestamp | DATETIME                    | -    |                                      |

---

### 7. DISPATCH_ITEMS
Specific items sold within a single dispatch receipt.

| Field Name            | Data Type | MySQL Type / Size             | Key  | Description                               |
| :-------------------- | :-------- | :---------------------------- | :--- | :---------------------------------------- |
| **dispatch_item_id**  | BigInt    | BIGINT UNSIGNED               | PK   | Unique ID ng item line.                   |
| **dispatch_id**       | BigInt    | BIGINT UNSIGNED               | FK   | Nakakonekta sa DISPATCHES.                |
| **batch_id**          | BigInt    | BIGINT UNSIGNED               | FK   | Nakakonekta sa BATCHES.                   |
| **product_id**        | BigInt    | BIGINT UNSIGNED               | FK   | Nakakonekta sa PRODUCTS.                  |
| **dispatch_uom**      | Enum      | ENUM('piece', 'kilo', 'roll') | -    | Unit used by customer.                    |
| **dispatch_quantity** | Decimal   | DECIMAL(10,2)                 | -    | Ilan ang inilagay ni Staff sa resibo.     |
| **quantity_deducted** | Decimal   | DECIMAL(10,4)                 | -    | Totoong ibinawas (converted to base_uom). |
| **unit_cost**         | Decimal   | DECIMAL(10,2)                 | -    | Snapshot ng puhunan nung araw na nabenta. |
| **created_at**        | Timestamp | DATETIME                      | -    |                                           |
| **updated_at**        | Timestamp | DATETIME                      | -    |                                           |

---

### 8. STOCK_ADJUSTMENTS
Manual adjustments for damaged goods, losses, or error corrections.

| Field Name            | Data Type | MySQL Type / Size                                     | Key  | Description                                             |
| :-------------------- | :-------- | :---------------------------------------------------- | :--- | :------------------------------------------------------ |
| **adjustment_id**     | BigInt    | BIGINT UNSIGNED                                       | PK   | Unique ID ng adjustment.                                |
| **batch_id**          | BigInt    | BIGINT UNSIGNED                                       | FK   | Nakakonekta sa BATCHES.                                 |
| **product_id**        | BigInt    | BIGINT UNSIGNED                                       | FK   | Nakakonekta sa PRODUCTS.                                |
| **user_id**           | BigInt    | BIGINT UNSIGNED                                       | FK   | Nakakonekta sa USERS.                                   |
| **quantity_adjusted** | Decimal   | DECIMAL(10,2)                                         | -    | Ilan ang binago (e.g., -5, o kaya +2).                  |
| **reason**            | Enum      | ENUM('damaged', 'lost', 'recount', 'system_reversal') | -    | Values: 'damaged', 'lost', 'recount', 'system_reversal' |
| **status**            | Enum      | ENUM('applied', 'voided')                             | -    | Values: 'applied', 'voided'                             |
| **created_at**        | Timestamp | DATETIME                                              | -    |                                                         |
| **updated_at**        | Timestamp | DATETIME                                              | -    |                                                         |

---

> **Note on Foreign Keys (FK):** These fields are essential for your database relationships. They ensure that data in one table correctly points to valid data in another.

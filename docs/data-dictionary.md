### 1. PRODUCTS
This table stores the master list of items available in the inventory.

| Field Name        | Data Type | MySQL Type / Size       | Key  | Description                                                    |
| :---------------- | :-------- | :---------------------- | :--- | :------------------------------------------------------------- |
| **id**            | BigInt    | BIGINT UNSIGNED         | PK   | Unique identifier for each product.                            |
| **sku_code**      | String    | VARCHAR(50)             | UK   | Unique Stock Keeping Unit (a unique code used to track items). |
| **name**          | String    | VARCHAR(255)            | -    | The name of the product.                                       |
| **category**      | Enum      | ENUM('sacks', 'twines') | -    | Product group (e.g., sacks, twines).                           |
| **base_uom**      | Enum      | ENUM('pieces', 'kilos') | -    | Base Unit of Measurement (e.g., pieces, kilos).                |
| **current_stock** | Decimal   | DECIMAL(12,2)           | -    | The total amount currently available.                          |
| **created_at**    | Timestamp | DATETIME                | -    | Date and time the record was created.                          |
| **updated_at**    | Timestamp | DATETIME                | -    | Date and time the record was last changed.                     |

---

### 2. SUPPLIERS
Contains contact information for the companies providing the goods.

| Field Name         | Data Type | MySQL Type / Size | Key  | Description                                 |
| :----------------- | :-------- | :---------------- | :--- | :------------------------------------------ |
| **id**             | BigInt    | BIGINT UNSIGNED   | PK   | Unique identifier for the supplier.         |
| **company_name**   | String    | VARCHAR(255)      | -    | Full name of the supplier company.          |
| **contact_person** | String    | VARCHAR(255)      | -    | Name of the primary contact at the company. |
| **contact_number** | String    | VARCHAR(20)       | -    | Phone number for communication.             |
| **address**        | Text      | VARCHAR(500)     | -    | Physical location of the supplier.          |
| **created_at**     | Timestamp | DATETIME          | -    | Record creation timestamp.                  |
| **updated_at**     | Timestamp | DATETIME          | -    | Record update timestamp.                    |

---

### 3. BATCHES
Tracks specific deliveries or groups of products received.

| Field Name             | Data Type | MySQL Type / Size | Key  | Description                                                |
| :--------------------- | :-------- | :---------------- | :--- | :--------------------------------------------------------- |
| **id**                 | BigInt    | BIGINT UNSIGNED   | PK   | Unique identifier for the batch.                           |
| **batch_code**         | String    | VARCHAR(50)       | UK   | Unique code assigned to a specific shipment.               |
| **unit_cost**          | Decimal   | DECIMAL(12,2)     | -    | The price paid per unit for this batch.                    |
| **quantity_received**  | Decimal   | DECIMAL(12,2)     | -    | Total amount delivered in this batch.                      |
| **quantity_remaining** | Decimal   | DECIMAL(12,2)     | -    | Amount still available for dispatch.                       |
| **created_at**         | Timestamp | DATETIME          | -    | When the batch was logged.                                 |
| **updated_at**         | Timestamp | DATETIME          | -    | Last update to the batch info.                             |
| **product_id**         | BigInt    | BIGINT UNSIGNED   | FK   | Links to the **PRODUCTS** table.                           |
| **supplier_id**        | BigInt    | BIGINT UNSIGNED   | FK   | Links to the **SUPPLIERS** table.                          |
| **user_id**            | BigInt    | BIGINT UNSIGNED   | FK   | Links to the **USERS** table (the person who received it). |

---

### 4. USERS
Stores information about the people who access the system.

| Field Name     | Data Type | MySQL Type / Size        | Key  | Description                             |
| :------------- | :-------- | :----------------------- | :--- | :-------------------------------------- |
| **id**         | BigInt    | BIGINT UNSIGNED          | PK   | Unique identifier for the user.         |
| **name**       | String    | VARCHAR(255)             | -    | Full name of the user.                  |
| **email**      | String    | VARCHAR(254)             | UK   | Email address used for login.           |
| **password**   | String    | VARCHAR(255)             | -    | Encrypted security key for the account. |
| **role**       | Enum      | ENUM('owner', 'cashier') | -    | Access level (e.g., owner, cashier).    |
| **created_at** | Timestamp | DATETIME                 | -    | When the account was created.           |
| **updated_at** | Timestamp | DATETIME                 | -    | When account details were last changed. |

---

### 5. DISPATCHES
Records the overall transaction when items are sent out or sold.

| Field Name             | Data Type | MySQL Type / Size | Key  | Description                                              |
| :--------------------- | :-------- | :---------------- | :--- | :------------------------------------------------------- |
| **id**                 | BigInt    | BIGINT UNSIGNED   | PK   | Unique identifier for the dispatch event.                |
| **customer_reference** | String    | VARCHAR(255)      | -    | Name or ID of the customer receiving the goods.          |
| **created_at**         | Timestamp | DATETIME          | -    | Date and time of the dispatch.                           |
| **updated_at**         | Timestamp | DATETIME          | -    | Last update to the record.                               |
| **user_id**            | BigInt    | BIGINT UNSIGNED   | FK   | Links to the **USERS** table (the person processing it). |

---

### 6. DISPATCH_ITEMS
A "bridge table" that links specific batches to dispatches (used for FIFO tracking).

| Field Name            | Data Type | MySQL Type / Size | Key  | Description                           |
| :-------------------- | :-------- | :---------------- | :--- | :------------------------------------ |
| **id**                | BigInt    | BIGINT UNSIGNED   | PK   | Unique identifier for this line item. |
| **quantity_deducted** | Decimal   | DECIMAL(12,2)     | -    | The amount taken out of inventory.    |
| **created_at**        | Timestamp | DATETIME          | -    | Timestamp of the deduction.           |
| **updated_at**        | Timestamp | DATETIME          | -    | Last update timestamp.                |
| **dispatch_id**       | BigInt    | BIGINT UNSIGNED   | FK   | Links to the **DISPATCHES** table.    |
| **product_id**        | BigInt    | BIGINT UNSIGNED   | FK   | Links to the **PRODUCTS** table.      |
| **batch_id**          | BigInt    | BIGINT UNSIGNED   | FK   | Links to the **BATCHES** table.       |

---

### 7. AUDIT_LOGS
A security table that tracks every action taken within the system.

| Field Name      | Data Type | MySQL Type / Size | Key  | Description                                      |
| :-------------- | :-------- | :---------------- | :--- | :----------------------------------------------- |
| **id**          | BigInt    | BIGINT UNSIGNED   | PK   | Unique identifier for the log entry.             |
| **action**      | String    | VARCHAR(100)      | -    | What happened (e.g., Created, Updated, Deleted). |
| **description** | Text      | TEXT              | -    | Specific details about the change.               |
| **ip_address**  | String    | VARCHAR(45)       | -    | The network address of the user.                 |
| **created_at**  | Timestamp | DATETIME          | -    | When the action occurred.                        |
| **updated_at**  | Timestamp | DATETIME          | -    | Usually same as created_at.                      |
| **user_id**     | BigInt    | BIGINT UNSIGNED   | FK   | Links to the **USERS** table (who did it).       |

---

> **Note on Foreign Keys (FK):** These fields are essential for your database relationships. They ensure that data in one table (like a Batch) correctly points to valid data in another (like a Product or Supplier).

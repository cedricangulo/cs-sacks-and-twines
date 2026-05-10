const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function csv(rows) {
    return rows.map(r =>
        r.map(field => {
            const str = String(field);
            // Quote fields that contain commas, quotes, or newlines
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
        }).join(',')
    ).join('\n');
}
function write(name, rows) {
    fs.writeFileSync(path.join(OUT_DIR, `${name}.csv`), csv(rows), 'utf8');
    console.log(`  ✓ ${name}.csv (${rows.length} rows)`);
}

function sqlValue(field) {
    if (field === null || field === undefined) {
        return 'NULL';
    }
    if (typeof field === 'number' && Number.isFinite(field)) {
        return String(field);
    }
    const str = String(field)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "''");
    return `'${str}'`;
}

function sqlInsert(table, columns, rows) {
    const columnList = columns.map(column => `\`${column}\``).join(', ');
    const values = rows.map(row => `(${row.map(sqlValue).join(', ')})`).join(',\n');
    return `INSERT INTO \`${table}\` (${columnList}) VALUES\n${values};\n`;
}

function writeSqlSeed(fileName, statements) {
    const header = [
        '-- Generated seed import file',
        '-- IMPORTANT: MySQL does not allow TRUNCATE on parent tables with FKs.',
        '-- Use DELETE order (children before parents) with FK checks disabled.',
        'SET FOREIGN_KEY_CHECKS = 0;',
        'SET UNIQUE_CHECKS = 0;',
        'START TRANSACTION;',
        '',
        '-- Delete order based on FK dependencies (children before parents).',
        'DELETE FROM `dispatch_items`;',
        'DELETE FROM `stock_adjustments`;',
        'DELETE FROM `audit_logs`;',
        'DELETE FROM `batches`;',
        'DELETE FROM `dispatches`;',
        'DELETE FROM `products`;',
        'DELETE FROM `suppliers`;',
        'DELETE FROM `users`;',
        '',
    ].join('\n');

    const footer = [
        'COMMIT;',
        'SET UNIQUE_CHECKS = 1;',
        'SET FOREIGN_KEY_CHECKS = 1;',
        ''
    ].join('\n');

    fs.writeFileSync(path.join(OUT_DIR, fileName), `${header}${statements.join('\n')}${footer}`, 'utf8');
    console.log(`  ✓ ${fileName} (${statements.length} tables)`);
}

// ─── Reference Dates ───────────────────────────────────────────────────────────────
const BASE = new Date('2025-05-01T00:00:00+08:00');
// Extend END to include May 10, 2026 (cover maximum date)
const END = new Date('2026-05-10T00:00:00+08:00');

function randDate(start, end) {
    const s = start.getTime(), e = end.getTime();
    return new Date(s + Math.random() * (e - s));
}
function bizDate(base, offsetHours) {
    const d = new Date(base);
    d.setHours(7 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60), 0, 0);
    return d;
}

// ─── Entities ──────────────────────────────────────────────────────────────────────
const OWNER_PASSWORD_HASH = '$2y$10$ACY3dNsDd50N.hE2abORqeCLVIkfDwXFEdjSp4FM4Cyx/I4gTztra';
const STAFF_PASSWORD_HASH = '$2y$10$txLPsrzk2X4P6zdEk40DLeCn0pEh3GzY9wnAl92EJBkb5TcNOAOFK';

const USERS = [
    { user_id: 1, name: 'Michael', email: 'newmichael@gmail.com', password_hash: OWNER_PASSWORD_HASH, role: 'owner' },
    { user_id: 2, name: 'Juan dela Cruz', email: 'juandelacruz@gmail.com', password_hash: STAFF_PASSWORD_HASH, role: 'staff' },
];

const SUPPLIERS = [
    { supplier_id: 1, company_name: 'Mabuhay Fiber Supply', contact_person: 'Roberto Santos', contact_number: '0917-123-4561', address: 'Davao City, Davao del Sur' },
    { supplier_id: 2, company_name: 'Golden Harvest Co.', contact_person: 'Lita Reyes', contact_number: '0918-234-5672', address: 'Cebu City, Cebu' },
    { supplier_id: 3, company_name: 'Baguio Twine Traders', contact_person: 'Miguel Ong', contact_number: '0919-345-6783', address: 'Baguio City, Benguet' },
    { supplier_id: 4, company_name: 'Luzon Sacks Inc.', contact_person: 'Ana Cruz', contact_number: '0920-456-7894', address: 'San Fernando, Pampanga' },
    { supplier_id: 5, company_name: 'Island Weave Corp.', contact_person: 'Carlos Lim', contact_number: '0921-567-8905', address: 'Iloilo City, Iloilo' },
    { supplier_id: 6, company_name: 'Palawan Raw Materials', contact_person: 'Elena Dimaano', contact_number: '0922-678-9016', address: 'Puerto Princesa, Palawan' },
];

// ─── Code Generation Helpers ──────────────────────────────────────────────────────
const GENERATED_BATCH_CODES = new Set();
const GENERATED_SKU_CODES = new Set();

function nextBatchCode() {
    // Generate BAT-YYYYMMDD-NNNN format to match system generation
    let attempts = 0;
    let batchCode;
    do {
        attempts++;
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const randomSuffix = String(Math.floor(Math.random() * 9000) + 1000);
        batchCode = `BAT-${dateStr}-${randomSuffix}`;
    } while (GENERATED_BATCH_CODES.has(batchCode) && attempts < 20);

    GENERATED_BATCH_CODES.add(batchCode);
    return batchCode;
}

function nextSkuCode() {
    // Generate SKU-YYYYMMDD-NNNN format to match system generation
    let attempts = 0;
    let skuCode;
    do {
        attempts++;
        const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const randomSuffix = String(Math.floor(Math.random() * 9000) + 1000);
        skuCode = `SKU-${dateStr}-${randomSuffix}`;
    } while (GENERATED_SKU_CODES.has(skuCode) && attempts < 20);

    GENERATED_SKU_CODES.add(skuCode);
    return skuCode;
}

const PRODUCTS = [
    { product_id: 1, sku_code: nextSkuCode(), name: 'Rice Sack', category: 'sacks', base_uom: 'piece', weight_per_unit: 0.5000, current_quantity: 0, total_asset_value: 0, low_stock_threshold: 100, image_path: '20260509000100-1f2e3d4c.jpg' },
    { product_id: 2, sku_code: nextSkuCode(), name: 'Gunny Sack', category: 'sacks', base_uom: 'piece', weight_per_unit: 0.6000, current_quantity: 0, total_asset_value: 0, low_stock_threshold: 100, image_path: '20260509000200-2a3b4c5d.jpg' },
    { product_id: 3, sku_code: nextSkuCode(), name: 'Flour Sack', category: 'sacks', base_uom: 'piece', weight_per_unit: 0.4000, current_quantity: 0, total_asset_value: 0, low_stock_threshold: 100, image_path: '20260509000300-3c4d5e6f.jpg' },
    { product_id: 4, sku_code: nextSkuCode(), name: 'Binder Twine', category: 'twines', base_uom: 'roll', weight_per_unit: 0.2500, current_quantity: 0, total_asset_value: 0, low_stock_threshold: 50, image_path: '20260509000400-4d5e6f70.jpg' },
    { product_id: 5, sku_code: nextSkuCode(), name: 'Baler Twine', category: 'twines', base_uom: 'roll', weight_per_unit: 0.2000, current_quantity: 0, total_asset_value: 0, low_stock_threshold: 50, image_path: '20260509000500-5e6f7081.jpg' },
    { product_id: 6, sku_code: nextSkuCode(), name: 'Sisal Twine', category: 'twines', base_uom: 'roll', weight_per_unit: 0.1500, current_quantity: 0, total_asset_value: 0, low_stock_threshold: 50, image_path: '20260509000600-6f708192.jpg' },
];

// ─── Batch Planning ─────────────────────────────────────────────────────────────────
const BATCHES = [];

function rnd(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function rndInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const PROC_START = new Date('2025-05-01T00:00:00+08:00');
const PROC_END = new Date(END.getTime());

// 1-5 batches per product spread across May 2025 → Feb 2026 (random distribution)
PRODUCTS.forEach(p => {
    const numBatches = rndInt(1, 5);
    let lastDate = PROC_START;
    for (let i = 0; i < numBatches; i++) {
        const span = PROC_END.getTime() - lastDate.getTime();
        const batchDate = new Date(lastDate.getTime() + Math.random() * span * 0.7);
        if (batchDate > PROC_END) continue;
        const supplier = rnd(SUPPLIERS);
        const user = rnd(USERS);

        // Cost varies by product type — realistic PHP ranges
        const unitCost = p.base_uom === 'piece'
            ? parseFloat((rndInt(45, 95) + Math.random()).toFixed(2))
            : parseFloat((rndInt(120, 280) + Math.random()).toFixed(2));

        // Quantity: sacks 200-400 (always integer/piece), twines 100-300 (can be decimal/kilo)
        const qty = p.base_uom === 'piece'
            ? rndInt(200, 400)
            : parseFloat((rndInt(100, 300) + Math.random()).toFixed(2));

        const batch = {
            batch_id: BATCHES.length + 1,
            product_id: p.product_id,
            supplier_id: supplier.supplier_id,
            user_id: user.user_id,
            batch_code: nextBatchCode(),
            total_procurement_cost: parseFloat((unitCost * qty).toFixed(2)),
            unit_cost: unitCost,
            quantity_received: qty,
            quantity_remaining: qty,
            status: 'active',
            created_at: batchDate.toISOString().replace('T', ' ').slice(0, 19),
            updated_at: batchDate.toISOString().replace('T', ' ').slice(0, 19),
        };
        BATCHES.push(batch);
        lastDate = batchDate;
    }
});

// ─── Dispatch Planning ──────────────────────────────────────────────────────────
// Peak: Dec 2025 – Mar 2026. Lean: Apr – Jul 2025 (lightened)
const DISP_PEAK_START = new Date('2025-10-01T00:00:00+08:00');
// Expand dispatch peak window to the overall END date so recent dispatches
// (up to the seed END) are included for "today/this week/this month" spans.
const DISP_PEAK_END = new Date(END.getTime());

const DISPATCHES = [];
const DISPATCH_ITEMS = [];

function pickBatchForProduct(productId, minQty) {
    // Pick an active batch for product, preferring ones with remaining stock
    const candidates = BATCHES.filter(b =>
        b.product_id === productId &&
        b.status === 'active' &&
        b.quantity_remaining >= minQty
    );
    if (candidates.length === 0) return null;
    return candidates.reduce((a, b) =>
        a.quantity_remaining > b.quantity_remaining ? a : b
    );
}

let dispatchId = 1;
let dispatchItemId = 1;

const NUM_DISPATCHES = 100;
for (let i = 0; i < NUM_DISPATCHES; i++) {
    // Weight dispatch frequency toward peak period
    const isPeak = Math.random() < 0.85;
    let dBase;
    if (isPeak) {
        dBase = new Date(DISP_PEAK_START.getTime() + Math.random() * (DISP_PEAK_END.getTime() - DISP_PEAK_START.getTime()));
    } else {
        // Spread remaining ~15% across May–Sep 2025
        dBase = new Date(BASE.getTime() + Math.random() * (DISP_PEAK_START.getTime() - BASE.getTime()));
    }

    const user = rnd(USERS);
    const isVoided = Math.random() < 0.05;
    const dispatch = {
        dispatch_id: dispatchId,
        user_id: user.user_id,
        customer_reference: rnd([
            null, 'PO-2025-' + rndInt(1000, 9999), 'SO-' + rndInt(100, 999),
            null, null, 'DR-' + rndInt(1000, 9999)
        ]),
        status: isVoided ? 'voided' : 'completed',
        created_at: bizDate(dBase, 0).toISOString().replace('T', ' ').slice(0, 19),
        updated_at: bizDate(dBase, 0).toISOString().replace('T', ' ').slice(0, 19),
    };
    DISPATCHES.push(dispatch);

    // 1–3 items per dispatch
    const numItems = rndInt(1, 3);
    let usedProductIds = new Set();
    for (let j = 0; j < numItems; j++) {
        const product = rnd(PRODUCTS.filter(p => !usedProductIds.has(p.product_id)));
        usedProductIds.add(product.product_id);

        const dispatchQty = product.base_uom === 'piece'
            ? rndInt(5, 50)
            : parseFloat((rndInt(2, 30) + Math.random()).toFixed(2));
        const batch = pickBatchForProduct(product.product_id, dispatchQty);
        if (!batch) continue;

        // dispatch_uom: matches base_uom (piece for sacks, roll for twines)
        const dispatchUom = product.base_uom;
        // quantity_deducted is weight in kilos: always decimal
        const qtyDeducted = parseFloat((dispatchQty * product.weight_per_unit).toFixed(4));

        if (qtyDeducted > batch.quantity_remaining) continue;

        const dispatchItem = {
            dispatch_item_id: dispatchItemId++,
            dispatch_id: dispatchId,
            batch_id: batch.batch_id,
            product_id: product.product_id,
            dispatch_uom: dispatchUom,
            dispatch_quantity: dispatchQty,
            quantity_deducted: qtyDeducted,
            unit_cost: batch.unit_cost,
            created_at: dispatch.created_at,
            updated_at: dispatch.created_at,
        };
        DISPATCH_ITEMS.push(dispatchItem);

        // Decrement batch remaining
        batch.quantity_remaining = parseFloat((batch.quantity_remaining - qtyDeducted).toFixed(4));
        if (batch.quantity_remaining <= 0) {
            batch.quantity_remaining = 0;
            batch.status = 'depleted';
        }
    }

    dispatchId++;
}

// ─── Stock Adjustments ─────────────────────────────────────────────────────────
const ADJUSTMENTS = [];
let adjId = 1;

PRODUCTS.forEach(p => {
    // 1–2 adjustments per product
    const numAdjs = rndInt(1, 2);
    const reasons = ['recount', 'damaged', 'lost', 'system_reversal'];
    for (let i = 0; i < numAdjs; i++) {
        const adjDate = bizDate(new Date(PROC_START.getTime() + Math.random() * (END.getTime() - PROC_START.getTime())), 0);
        const batch = rnd(BATCHES.filter(b => b.product_id === p.product_id && b.status === 'active'));
        if (!batch) continue;
        const user = rnd(USERS);
        // Sacks: always integer (piece), twines: can be decimal (kilo)
        const qty = p.base_uom === 'piece'
            ? rndInt(1, 20)
            : parseFloat((rndInt(1, 20) + Math.random()).toFixed(2));
        const reason = rnd(reasons);
        const adjustment = {
            adjustment_id: adjId++,
            batch_id: batch.batch_id,
            product_id: p.product_id,
            user_id: user.user_id,
            quantity_adjusted: qty,
            reason: reason,
            status: Math.random() < 0.1 ? 'voided' : 'applied',
            created_at: adjDate.toISOString().replace('T', ' ').slice(0, 19),
            updated_at: adjDate.toISOString().replace('T', ' ').slice(0, 19),
        };
        ADJUSTMENTS.push(adjustment);

        // Apply to batch (keep as integer for sacks, decimal for twines)
        if (adjustment.status === 'applied') {
            const newRemaining = batch.quantity_remaining - qty;
            batch.quantity_remaining = p.base_uom === 'piece'
                ? Math.max(0, newRemaining)
                : parseFloat(Math.max(0, newRemaining).toFixed(2));
            if (batch.quantity_remaining <= 0) {
                batch.quantity_remaining = 0;
                batch.status = 'depleted';
            }
        }
    }
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────
const LOGS = [];
let logId = 2;

function logAction(userId, action, resourceType, resourceId, metadata, refDate, ip = '127.0.0.1', userAgent = 'Node.js seed generator') {
    const ts = bizDate(refDate, 0);
    const payload = {
        ...metadata,
        resource_type: resourceType,
        resource_id: resourceId,
    };
    LOGS.push({
        log_id: logId++,
        user_id: userId,
        action: action,
        description: JSON.stringify(payload),
        ip_address: ip,
        user_agent: userAgent,
        created_at: ts.toISOString().replace('T', ' ').slice(0, 19),
        updated_at: ts.toISOString().replace('T', ' ').slice(0, 19),
    });
}

BATCHES.forEach(b => {
    const p = PRODUCTS.find(x => x.product_id === b.product_id);
    logAction(
        b.user_id,
        'stock_in',
        'product',
        b.product_id,
        {
            product_name: p.name,
            quantity: parseFloat(b.quantity_received.toFixed(2)),
            uom: p.base_uom,
            batch_code: b.batch_code,
        },
        new Date(b.created_at)
    );
});

DISPATCHES.forEach(d => {
    const items = DISPATCH_ITEMS.filter(x => x.dispatch_id === d.dispatch_id);
    if (d.status === 'completed') {
        logAction(
            d.user_id,
            'stock_out',
            'dispatch',
            d.dispatch_id,
            {
                total_quantity: parseFloat(
                    items.reduce((sum, item) => sum + item.dispatch_quantity, 0).toFixed(2)
                ),
                items_count: items.length,
                customer_reference: d.customer_reference || null,
                products: items.map(item => {
                    const product = PRODUCTS.find(x => x.product_id === item.product_id);
                    return {
                        name: product.name,
                        category: product.category,
                        uom: item.dispatch_uom,
                        quantity: item.dispatch_quantity,
                    };
                }),
            },
            new Date(d.created_at)
        );
    }
});

ADJUSTMENTS.forEach(a => {
    const batch = BATCHES.find(x => x.batch_id === a.batch_id);
    if (a.status === 'applied') {
        const beforeRemaining = batch.quantity_remaining;
        const afterRemaining = parseFloat((beforeRemaining - a.quantity_adjusted).toFixed(4));

        logAction(
            a.user_id,
            'batch_update',
            'batch',
            a.batch_id,
            {
                batch_id: batch.batch_id,
                batch_code: batch.batch_code,
                changes: {
                    quantity_remaining: {
                        old: parseFloat(beforeRemaining.toFixed(4)),
                        new: parseFloat(afterRemaining.toFixed(4)),
                    },
                },
            },
            new Date(a.created_at)
        );
    } else {
        logAction(
            a.user_id,
            'batch_void',
            'batch',
            a.batch_id,
            {
                batch_id: batch.batch_id,
                batch_code: batch.batch_code,
                quantity_removed: parseFloat(a.quantity_adjusted.toFixed(2)),
                cost_removed: parseFloat((a.quantity_adjusted * batch.unit_cost).toFixed(2)),
                reason: a.reason,
            },
            new Date(a.created_at)
        );
    }
});

// Seed a realistic session trail that matches the auth controller.
const AUTH_EVENTS = [
    {
        action: 'auth_sign_in_failed',
        resourceId: null,
        refDate: new Date('2025-05-02T00:00:00+08:00'),
        ip: '203.0.113.10',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        metadata: { email: 'newmichael@gmail.com', reason: 'invalid_credentials' },
    },
    {
        action: 'auth_sign_in',
        resourceId: 1,
        refDate: new Date('2025-05-03T00:00:00+08:00'),
        ip: '203.0.113.10',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        metadata: { email: 'newmichael@gmail.com', name: 'Michael', role: 'owner' },
    },
    {
        action: 'auth_sign_out',
        resourceId: 1,
        refDate: new Date('2026-05-08T00:00:00+08:00'),
        ip: '203.0.113.10',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        metadata: { email: 'newmichael@gmail.com', name: 'Michael' },
    },
    {
        action: 'auth_sign_in_failed',
        resourceId: null,
        refDate: new Date('2025-05-04T00:00:00+08:00'),
        ip: '203.0.113.24',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
        metadata: { email: 'juandelacruz@gmail.com', reason: 'invalid_credentials' },
    },
    {
        action: 'auth_sign_in',
        resourceId: 2,
        refDate: new Date('2025-05-05T00:00:00+08:00'),
        ip: '203.0.113.24',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
        metadata: { email: 'juandelacruz@gmail.com', name: 'Juan dela Cruz', role: 'staff' },
    },
    {
        action: 'auth_sign_out',
        resourceId: 2,
        refDate: new Date('2026-04-30T00:00:00+08:00'),
        ip: '203.0.113.24',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
        metadata: { email: 'juandelacruz@gmail.com', name: 'Juan dela Cruz' },
    },
];

AUTH_EVENTS.forEach(event => {
    logAction(
        event.resourceId,
        event.action,
        'user',
        event.resourceId,
        event.metadata,
        event.refDate,
        event.ip,
        event.userAgent,
    );
});

LOGS.sort((a, b) => a.created_at.localeCompare(b.created_at) || a.log_id - b.log_id);

// ─── Sort & Update Product Stock ───────────────────────────────────────────
PRODUCTS.forEach(p => {
    const activeBatches = BATCHES.filter(b =>
        b.product_id === p.product_id && b.status === 'active'
    );
    const allBatches = BATCHES.filter(b => b.product_id === p.product_id);

    // Sacks: keep as integer (piece), twines: keep as decimal (kilo)
    const sum = activeBatches.reduce((sum, b) => sum + b.quantity_remaining, 0);
    p.current_quantity = p.base_uom === 'piece'
        ? Math.round(sum)
        : parseFloat(sum.toFixed(2));

    // FIFO: use latest active batch unit cost for asset value
    if (activeBatches.length > 0) {
        const latest = activeBatches.reduce((a, b) =>
            new Date(a.created_at) > new Date(b.created_at) ? a : b
        );
        p.total_asset_value = parseFloat((p.current_quantity * latest.unit_cost).toFixed(2));
    } else if (allBatches.length > 0) {
        const latest = allBatches.reduce((a, b) =>
            new Date(a.created_at) > new Date(b.created_at) ? a : b
        );
        p.total_asset_value = parseFloat((p.current_quantity * latest.unit_cost).toFixed(2));
    }
});

// ─── Write CSVs ──────────────────────────────────────────────────────────────
console.log('\nGenerating seed data CSVs …\n');

// users
write('users', USERS.map(u => [
    u.user_id, u.name, u.email, u.password_hash, u.role,
    new Date(BASE).toISOString().replace('T', ' ').slice(0, 19),
    new Date(BASE).toISOString().replace('T', ' ').slice(0, 19),
]));

// suppliers
write('suppliers', SUPPLIERS.map(s => [
    s.supplier_id, s.company_name, s.contact_person, s.contact_number, s.address,
    new Date(BASE).toISOString().replace('T', ' ').slice(0, 19),
    new Date(BASE).toISOString().replace('T', ' ').slice(0, 19),
]));

// products
write('products', PRODUCTS.map(p => [
    p.product_id, p.sku_code, p.name, p.category, p.base_uom,
    p.weight_per_unit, p.current_quantity, p.total_asset_value, p.low_stock_threshold,
    'active', p.image_path,
    new Date(BASE).toISOString().replace('T', ' ').slice(0, 19),
    new Date(BASE).toISOString().replace('T', ' ').slice(0, 19),
]));

// batches
write('batches', BATCHES.map(b => [
    b.batch_id, b.product_id, b.supplier_id, b.user_id, b.batch_code,
    b.total_procurement_cost, b.unit_cost, b.quantity_received, b.quantity_remaining,
    b.status, b.created_at, b.updated_at,
]));

// dispatches
write('dispatches', DISPATCHES.map(d => [
    d.dispatch_id, d.user_id, d.customer_reference === null ? '' : d.customer_reference,
    d.status, d.created_at, d.updated_at,
]));

// dispatch_items
write('dispatch_items', DISPATCH_ITEMS.map(di => [
    di.dispatch_item_id, di.dispatch_id, di.batch_id, di.product_id,
    di.dispatch_uom, di.dispatch_quantity, di.quantity_deducted, di.unit_cost,
    di.created_at, di.updated_at,
]));

// stock_adjustments
write('stock_adjustments', ADJUSTMENTS.map(a => [
    a.adjustment_id, a.batch_id, a.product_id, a.user_id,
    a.quantity_adjusted, a.reason, a.status, a.created_at, a.updated_at,
]));

// audit_logs
write('audit_logs', LOGS.map(l => [
    l.log_id, l.user_id, l.action, l.description,
    l.ip_address, l.user_agent, l.created_at, l.updated_at,
]));

writeSqlSeed('seed.sql', [
    sqlInsert('users', ['user_id', 'name', 'email', 'password_hash', 'role', 'created_at', 'updated_at'], USERS.map(u => [
        u.user_id, u.name, u.email, u.password_hash, u.role,
        new Date(BASE).toISOString().replace('T', ' ').slice(0, 19),
        new Date(BASE).toISOString().replace('T', ' ').slice(0, 19),
    ])),
    sqlInsert('suppliers', ['supplier_id', 'company_name', 'contact_person', 'contact_number', 'address', 'created_at', 'updated_at'], SUPPLIERS.map(s => [
        s.supplier_id, s.company_name, s.contact_person, s.contact_number, s.address,
        new Date(BASE).toISOString().replace('T', ' ').slice(0, 19),
        new Date(BASE).toISOString().replace('T', ' ').slice(0, 19),
    ])),
    sqlInsert('products', ['product_id', 'sku_code', 'name', 'category', 'base_uom', 'weight_per_unit', 'current_quantity', 'total_asset_value', 'low_stock_threshold', 'status', 'image_path', 'created_at', 'updated_at'], PRODUCTS.map(p => [
        p.product_id, p.sku_code, p.name, p.category, p.base_uom,
        p.weight_per_unit, p.current_quantity, p.total_asset_value, p.low_stock_threshold,
        'active', p.image_path,
        new Date(BASE).toISOString().replace('T', ' ').slice(0, 19),
        new Date(BASE).toISOString().replace('T', ' ').slice(0, 19),
    ])),
    sqlInsert('batches', ['batch_id', 'product_id', 'supplier_id', 'user_id', 'batch_code', 'total_procurement_cost', 'unit_cost', 'quantity_received', 'quantity_remaining', 'status', 'created_at', 'updated_at'], BATCHES.map(b => [
        b.batch_id, b.product_id, b.supplier_id, b.user_id, b.batch_code,
        b.total_procurement_cost, b.unit_cost, b.quantity_received, b.quantity_remaining,
        b.status, b.created_at, b.updated_at,
    ])),
    sqlInsert('dispatches', ['dispatch_id', 'user_id', 'customer_reference', 'status', 'created_at', 'updated_at'], DISPATCHES.map(d => [
        d.dispatch_id, d.user_id, d.customer_reference, d.status, d.created_at, d.updated_at,
    ])),
    sqlInsert('dispatch_items', ['dispatch_item_id', 'dispatch_id', 'batch_id', 'product_id', 'dispatch_uom', 'dispatch_quantity', 'quantity_deducted', 'unit_cost', 'created_at', 'updated_at'], DISPATCH_ITEMS.map(di => [
        di.dispatch_item_id, di.dispatch_id, di.batch_id, di.product_id,
        di.dispatch_uom, di.dispatch_quantity, di.quantity_deducted, di.unit_cost,
        di.created_at, di.updated_at,
    ])),
    sqlInsert('stock_adjustments', ['adjustment_id', 'batch_id', 'product_id', 'user_id', 'quantity_adjusted', 'reason', 'status', 'created_at', 'updated_at'], ADJUSTMENTS.map(a => [
        a.adjustment_id, a.batch_id, a.product_id, a.user_id,
        a.quantity_adjusted, a.reason, a.status, a.created_at, a.updated_at,
    ])),
    sqlInsert('audit_logs', ['log_id', 'user_id', 'action', 'description', 'ip_address', 'user_agent', 'created_at', 'updated_at'], LOGS.map(l => [
        l.log_id, l.user_id, l.action, l.description,
        l.ip_address, l.user_agent, l.created_at, l.updated_at,
    ])),
]);

console.log('\nDone. All files written to scripts/data/\n');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function csv(rows) {
    return rows.map(r => r.join(',')).join('\n');
}
function write(name, rows) {
    fs.writeFileSync(path.join(OUT_DIR, `${name}.csv`), csv(rows), 'utf8');
    console.log(`  ✓ ${name}.csv (${rows.length} rows)`);
}

// ─── Reference Dates ───────────────────────────────────────────────────────────────
const BASE = new Date('2025-05-01T00:00:00+08:00');
const END  = new Date('2026-05-01T00:00:00+08:00');

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
const USERS = [
    { user_id: 1, name: 'Owner', email: 'owner@csacks.com', role: 'owner' },
    { user_id: 2, name: 'Staff', email: 'staff@csacks.com', role: 'staff' },
];

const SUPPLIERS = [
    { supplier_id: 1, company_name: 'Mabuhay Fiber Supply',   contact_person: 'Roberto Santos', contact_number: '0917-123-4561', address: 'Davao City / Davao del Sur' },
    { supplier_id: 2, company_name: 'Golden Harvest Co.',    contact_person: 'Lita Reyes',      contact_number: '0918-234-5672', address: 'Cebu City / Cebu' },
    { supplier_id: 3, company_name: 'Baguio Twine Traders',   contact_person: 'Miguel Ong',       contact_number: '0919-345-6783', address: 'Baguio City / Benguet' },
    { supplier_id: 4, company_name: 'Luzon Sacks Inc.',      contact_person: 'Ana Cruz',         contact_number: '0920-456-7894', address: 'San Fernando / Pampanga' },
    { supplier_id: 5, company_name: 'Island Weave Corp.',     contact_person: 'Carlos Lim',       contact_number: '0921-567-8905', address: 'Iloilo City / Iloilo' },
    { supplier_id: 6, company_name: 'Palawan Raw Materials',   contact_person: 'Elena Dimaano',   contact_number: '0922-678-9016', address: 'Puerto Princesa / Palawan' },
];

const PRODUCTS = [
    { product_id: 1, sku_code: 'SAC-RICE-50',    name: 'Rice Sack',       category: 'sacks', base_uom: 'piece', weight_per_unit: 0.5000, current_quantity: 0, total_asset_value: 0, low_stock_threshold: 100 },
    { product_id: 2, sku_code: 'SAC-GUNNY-60',   name: 'Gunny Sack',      category: 'sacks', base_uom: 'piece', weight_per_unit: 0.6000, current_quantity: 0, total_asset_value: 0, low_stock_threshold: 100 },
    { product_id: 3, sku_code: 'SAC-FLOUR-40',  name: 'Flour Sack',     category: 'sacks', base_uom: 'piece', weight_per_unit: 0.4000, current_quantity: 0, total_asset_value: 0, low_stock_threshold: 100 },
    { product_id: 4, sku_code: 'TWN-BIND-ROLL',   name: 'Binder Twine',   category: 'twines', base_uom: 'roll', weight_per_unit: 0.2500, current_quantity: 0, total_asset_value: 0, low_stock_threshold: 50 },
    { product_id: 5, sku_code: 'TWN-BALER-ROLL', name: 'Baler Twine',  category: 'twines', base_uom: 'roll', weight_per_unit: 0.2000, current_quantity: 0, total_asset_value: 0, low_stock_threshold: 50 },
    { product_id: 6, sku_code: 'TWN-SISAL-ROLL', name: 'Sisal Twine',    category: 'twines', base_uom: 'roll', weight_per_unit: 0.1500, current_quantity: 0, total_asset_value: 0, low_stock_threshold: 50 },
];

// ─── Batch Planning ─────────────────────────────────────────────────────────────────
const BATCHES = [];
const BATCH_CODE_COUNTER = { n: 1 };
function nextBatchCode() {
    return 'BAT-' + String(BATCH_CODE_COUNTER.n++).padStart(5, '0');
}
function rnd(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function rndInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const PROC_START = new Date('2025-05-01T00:00:00+08:00');
const PROC_END   = new Date('2026-02-01T00:00:00+08:00');

// ~2-3 batches per product spread across May 2025 → Feb 2026
PRODUCTS.forEach(p => {
    const numBatches = rndInt(2, 3);
    let lastDate = PROC_START;
    for (let i = 0; i < numBatches; i++) {
        const span = PROC_END.getTime() - lastDate.getTime();
        const batchDate = new Date(lastDate.getTime() + Math.random() * span * 0.7);
        if (batchDate > PROC_END) continue;
        const supplier = rnd(SUPPLIERS);
        const user    = rnd(USERS);

        // Cost varies by product type — realistic PHP ranges
        const unitCost = p.base_uom === 'piece'
            ? parseFloat((rndInt(45, 95) + Math.random()).toFixed(2))
            : parseFloat((rndInt(120, 280) + Math.random()).toFixed(2));

        // Quantity: sacks 200-400, twines 100-300
        const qty = p.base_uom === 'piece'
            ? rndInt(200, 400)
            : rndInt(100, 300);

        const batch = {
            batch_id:           BATCHES.length + 1,
            product_id:         p.product_id,
            supplier_id:       supplier.supplier_id,
            user_id:           user.user_id,
            batch_code:        nextBatchCode(),
            total_procurement_cost: parseFloat((unitCost * qty).toFixed(2)),
            unit_cost:          unitCost,
            quantity_received: qty,
            quantity_remaining: qty,
            status:            'active',
            created_at:        batchDate.toISOString().replace('T', ' ').slice(0, 19),
            updated_at:        batchDate.toISOString().replace('T', ' ').slice(0, 19),
        };
        BATCHES.push(batch);
        lastDate = batchDate;
    }
});

// ─── Dispatch Planning ──────────────────────────────────────────────────────────
// Peak: Dec 2025 – Mar 2026. Lean: Apr – Jul 2025 (lightened)
const DISP_PEAK_START = new Date('2025-10-01T00:00:00+08:00');
const DISP_PEAK_END  = new Date('2026-04-01T00:00:00+08:00');

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
        dispatch_id:     dispatchId,
        user_id:        user.user_id,
        customer_reference: rnd([
            null, 'PO-2025-' + rndInt(1000, 9999), 'SO-' + rndInt(100, 999),
            null, null, 'DR-' + rndInt(1000, 9999)
        ]),
        status:         isVoided ? 'voided' : 'completed',
        created_at:    bizDate(dBase, 0).toISOString().replace('T', ' ').slice(0, 19),
        updated_at:    bizDate(dBase, 0).toISOString().replace('T', ' ').slice(0, 19),
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
            : rndInt(2, 30);
        const batch = pickBatchForProduct(product.product_id, dispatchQty);
        if (!batch) continue;

        // dispatch_uom: sacks always piece, twines always roll
        const dispatchUom = product.base_uom;
        const qtyDeducted = parseFloat((dispatchQty * product.weight_per_unit).toFixed(4));

        if (qtyDeducted > batch.quantity_remaining) continue;

        const dispatchItem = {
            dispatch_item_id: dispatchItemId++,
            dispatch_id:      dispatchId,
            batch_id:         batch.batch_id,
            product_id:      product.product_id,
            dispatch_uom:     dispatchUom,
            dispatch_quantity: dispatchQty,
            quantity_deducted:  qtyDeducted,
            unit_cost:        batch.unit_cost,
            created_at:       dispatch.created_at,
            updated_at:       dispatch.created_at,
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
        const qty = parseFloat((rndInt(1, 20) * p.weight_per_unit).toFixed(2));
        const reason = rnd(reasons);
        const adjustment = {
            adjustment_id:    adjId++,
            batch_id:        batch.batch_id,
            product_id:     p.product_id,
            user_id:        user.user_id,
            quantity_adjusted: qty,
            reason:         reason,
            status:         Math.random() < 0.1 ? 'voided' : 'applied',
            created_at:     adjDate.toISOString().replace('T', ' ').slice(0, 19),
            updated_at:     adjDate.toISOString().replace('T', ' ').slice(0, 19),
        };
        ADJUSTMENTS.push(adjustment);

        // Apply to batch
        if (adjustment.status === 'applied') {
            batch.quantity_remaining = parseFloat((batch.quantity_remaining - qty).toFixed(4));
            if (batch.quantity_remaining <= 0) {
                batch.quantity_remaining = 0;
                batch.status = 'depleted';
            }
        }
    }
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────
const LOGS = [];
let logId = 1;

function logAction(userId, action, description, refDate, ip = '127.0.0.1') {
    const ts = bizDate(refDate, 0);
    LOGS.push({
        log_id:      logId++,
        user_id:     userId,
        action:      action,
        description: description,
        ip_address: ip,
        created_at:  ts.toISOString().replace('T', ' ').slice(0, 19),
        updated_at:  ts.toISOString().replace('T', ' ').slice(0, 19),
    });
}

BATCHES.forEach(b => {
    const p = PRODUCTS.find(x => x.product_id === b.product_id);
    const s = SUPPLIERS.find(x => x.supplier_id === b.supplier_id);
    logAction(b.user_id, 'batch.create',
        `Batch ${b.batch_code} created for ${p.name} from ${s.company_name} — ${b.quantity_received} ${p.base_uom}(s) @ PHP ${b.unit_cost}/unit`,
        new Date(b.created_at));
});

DISPATCHES.forEach(d => {
    if (d.status === 'completed') {
        const items = DISPATCH_ITEMS.filter(x => x.dispatch_id === d.dispatch_id);
        logAction(d.user_id, 'dispatch.create',
            `Dispatch #${d.dispatch_id} created with ${items.length} item(s)`,
            new Date(d.created_at));
    } else {
        logAction(d.user_id, 'dispatch.void',
            `Dispatch #${d.dispatch_id} voided`,
            new Date(d.created_at));
    }
});

ADJUSTMENTS.forEach(a => {
    const p = PRODUCTS.find(x => x.product_id === a.product_id);
    if (a.status === 'applied') {
        logAction(a.user_id, 'adjustment.apply',
            `Stock adjustment applied to ${p.name}: ${a.quantity_adjusted} ${p.base_uom}(s) — ${a.reason}`,
            new Date(a.created_at));
    } else {
        logAction(a.user_id, 'adjustment.void',
            `Stock adjustment #${a.adjustment_id} voided`,
            new Date(a.created_at));
    }
});

// ─── Sort & Update Product Stock ───────────────────────────────────────────
PRODUCTS.forEach(p => {
    const activeBatches = BATCHES.filter(b =>
        b.product_id === p.product_id && b.status === 'active'
    );
    const allBatches = BATCHES.filter(b => b.product_id === p.product_id);

    p.current_quantity = parseFloat(
        activeBatches.reduce((sum, b) => sum + b.quantity_remaining, 0).toFixed(2)
    );

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
    u.user_id, u.name, u.email, 'PASSWORD_EXAMPLE_HASH', u.role,
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
    'active', null,
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
    l.ip_address, l.created_at, l.updated_at,
]));

console.log('\nDone. All files written to scripts/data/\n');
<?php

declare(strict_types=1);

return [
  '/api/inventory/save' => [
    'title' => 'Save inventory',
    'type' => 'api',
    'controller' => __DIR__ . '/../../controllers/inventory/InventoryController.php',
    'class' => 'InventoryController',
    'method' => 'save',
    'layout' => 'none',
    'methods' => ['POST'],
    'roles' => ['owner'],
    'nav' => [
      'show' => false,
    ],
  ],
  '/api/products' => [
    'title' => 'API Products',
    'type' => 'api',
    'controller' => __DIR__ . '/../../controllers/inventory/InventoryController.php',
    'class' => 'InventoryController',
    'method' => 'getProductsJson',
    'layout' => 'none',
    'methods' => ['GET'],
    'roles' => ['owner'],
    'nav' => [
      'show' => false,
    ],
  ],
  '/api/suppliers' => [
    'title' => 'API Suppliers',
    'type' => 'api',
    'controller' => __DIR__ . '/../../controllers/Suppliers/SuppliersController.php',
    'class' => 'SuppliersController',
    'method' => 'getSuppliersJson',
    'layout' => 'none',
    'methods' => ['GET'],
    'roles' => ['owner'],
    'nav' => [
      'show' => false,
    ],
  ],
  '/api/suppliers/save' => [
    'title' => 'Save supplier',
    'type' => 'api',
    'controller' => __DIR__ . '/../../controllers/Suppliers/SuppliersController.php',
    'class' => 'SuppliersController',
    'method' => 'save',
    'layout' => 'none',
    'methods' => ['POST'],
    'roles' => ['owner'],
    'nav' => [
      'show' => false,
    ],
  ],
  '/api/inventory/batches' => [
    'title' => 'Get batches',
    'type' => 'api',
    'controller' => __DIR__ . '/../../controllers/inventory/BatchController.php',
    'class' => 'BatchController',
    'method' => 'getBatchesJson',
    'layout' => 'none',
    'methods' => ['GET'],
    'roles' => ['owner'],
    'nav' => [
      'show' => false,
    ],
  ],
  '/api/inventory/batches/count' => [
    'title' => 'Get batch count',
    'type' => 'api',
    'controller' => __DIR__ . '/../../controllers/inventory/BatchController.php',
    'class' => 'BatchController',
    'method' => 'getBatchCountJson',
    'layout' => 'none',
    'methods' => ['GET'],
    'roles' => ['owner'],
    'nav' => [
      'show' => false,
    ],
  ],
  '/supplier/save' => [
    'title' => 'Save supplier (legacy)',
    'type' => 'api',
    'controller' => __DIR__ . '/../../controllers/Suppliers/SuppliersController.php',
    'class' => 'SuppliersController',
    'method' => 'save',
    'layout' => 'none',
    'methods' => ['POST'],
    'roles' => ['owner'],
    'nav' => [
      'show' => false,
    ],
  ],
];

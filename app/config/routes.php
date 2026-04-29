<?php

declare(strict_types=1);

return array_replace(
  require __DIR__ . '/routes/web.php',
  require __DIR__ . '/routes/api.php'
);

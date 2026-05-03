<?php

declare(strict_types=1);

/**
 * Reusable query builder for server-side filtering, searching, and sorting.
 *
 * Usage:
 *   $qf = new QueryFilter($pdo, 'audit_logs al');
 *   $qf->join('users u ON u.user_id = al.user_id');
 *   $qf->search($_GET['search'] ?? '', ['al.description', 'u.name']);
 *   $qf->where('al.action', $_GET['action'] ?? null);
 *   $qf->dateRange('al.created_at', $_GET['date_from'] ?? null, $_GET['date_to'] ?? null);
 *   $qf->sort('al.created_at', 'DESC', $_GET['sort'] ?? '', $_GET['dir'] ?? '');
 *   $qf->paginate($_GET['page'] ?? 1, $_GET['limit'] ?? 20);
 *
 *   $rows = $qf->select('al.log_id, al.action, al.description, ...');
 *   $total = $qf->count();
 */
class QueryFilter
{
    private PDO $pdo;
    private string $table;

    /** @var array<string> */
    private array $joins = [];

    /** @var array<string> */
    private array $where = [];

    /** @var array<string, mixed> */
    private array $bindings = [];

    private string $orderBy = '';
    private ?int $limit = null;
    private ?int $offset = null;
    private ?int $page = null;

    public function __construct(PDO $pdo, string $table)
    {
        $this->pdo = $pdo;
        $this->table = $table;
    }

    /**
     * Add a JOIN clause.
     *
     * @param string $join e.g. 'users u ON u.user_id = al.user_id'
     * @return self
     */
    public function join(string $join): self
    {
        $this->joins[] = $join;
        return $this;
    }

    /**
     * Add a full-text search across multiple columns using LIKE.
     *
     * @param string $query The search term from user input
     * @param array<string> $columns Columns to search (with table alias if needed)
     * @return self
     */
    public function search(string $query, array $columns): self
    {
        $query = trim($query);
        if ($query === '' || $columns === []) {
            return $this;
        }

        $patterns = [];
        $paramBase = 'search_' . substr(md5($query), 0, 6);
        $wildcard = '%' . strtolower($query) . '%';

        foreach ($columns as $i => $col) {
            $param = $paramBase . '_' . $i;
            $patterns[] = "LOWER({$col}) LIKE :{$param}";
            $this->bindings[$param] = $wildcard;
        }

        $this->where[] = '(' . implode(' OR ', $patterns) . ')';

        return $this;
    }

    /**
     * Add an exact-match WHERE clause (only if value is non-null and non-empty).
     *
     * @param string $column e.g. 'al.action'
     * @param string|int|float|null $value
     * @return self
     */
    public function where(string $column, $value): self
    {
        $value = is_string($value) ? trim($value) : $value;
        if ($value === '' || $value === null) {
            return $this;
        }

        $param = 'w_' . substr(md5($column), 0, 6) . '_' . count($this->where);
        $this->where[] = "{$column} = :{$param}";
        $this->bindings[$param] = $value;

        return $this;
    }

    /**
     * Add a date range filter on a column.
     *
     * @param string $column e.g. 'al.created_at'
     * @param string|null $from ISO date (e.g. 2024-01-01)
     * @param string|null $to ISO date (e.g. 2024-12-31)
     * @return self
     */
    public function dateRange(string $column, ?string $from, ?string $to): self
    {
        if ($from !== null && trim($from) !== '') {
            $param = 'date_from_' . substr(md5($column), 0, 6);
            $this->where[] = "{$column} >= :{$param}";
            $this->bindings[$param] = trim($from) . ' 00:00:00';
        }

        if ($to !== null && trim($to) !== '') {
            $param = 'date_to_' . substr(md5($column), 0, 6);
            $this->where[] = "{$column} <= :{$param}";
            $this->bindings[$param] = trim($to) . ' 23:59:59';
        }

        return $this;
    }

    /**
     * Set ORDER BY from user-provided sort column and direction.
     *
     * @param string $default Default column to sort by (e.g. 'al.created_at')
     * @param string $defaultDir Default direction ('ASC' or 'DESC')
     * @param string $userColumn User-provided column from request
     * @param string $userDir User-provided direction from request
     * @param array<string>|null $allowedColumns If set, only these columns are allowed
     * @return self
     */
    public function sort(
        string $default,
        string $defaultDir,
        string $userColumn = '',
        string $userDir = '',
        ?array $allowedColumns = null
    ): self {
        $column = trim($userColumn) !== '' ? trim($userColumn) : $default;

        if ($allowedColumns !== null && !in_array($column, $allowedColumns, true)) {
            $column = $default;
        }

        $dir = strtoupper(trim($userDir)) === 'ASC' ? 'ASC' : $defaultDir;

        $this->orderBy = "ORDER BY {$column} {$dir}";

        return $this;
    }

    /**
     * Set pagination from page number and per-page limit.
     *
     * @param int|string $page Current page (1-indexed)
     * @param int|string $limit Items per page (max 100)
     * @return self
     */
    public function paginate($page, $limit): self
    {
        $this->page = max(1, (int) $page);
        $this->limit = max(1, min(100, (int) $limit));
        $this->offset = ($this->page - 1) * $this->limit;

        return $this;
    }

    /**
     * Execute the SELECT query and return rows.
     *
     * @param string $columns Column list (e.g. 'al.log_id, al.action, u.name')
     * @return array<int, array<string, mixed>>
     */
    public function select(string $columns): array
    {
        $sql = "SELECT {$columns} FROM {$this->table}";
        $sql .= $this->buildJoins();
        $sql .= $this->buildWhere();
        $sql .= $this->orderBy !== '' ? ' ' . $this->orderBy : '';
        $sql .= $this->limit !== null ? " LIMIT :limit OFFSET :offset" : '';

        $stmt = $this->pdo->prepare($sql);

        foreach ($this->bindings as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        if ($this->limit !== null) {
            $stmt->bindValue('limit', $this->limit, PDO::PARAM_INT);
            $stmt->bindValue('offset', $this->offset, PDO::PARAM_INT);
        }

        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Get total count matching the current WHERE/JOIN conditions.
     *
     * @return int
     */
    public function count(): int
    {
        $sql = "SELECT COUNT(*) FROM {$this->table}";
        $sql .= $this->buildJoins();
        $sql .= $this->buildWhere();

        $stmt = $this->pdo->prepare($sql);

        foreach ($this->bindings as $key => $value) {
            $stmt->bindValue($key, $value);
        }

        $stmt->execute();

        return (int) $stmt->fetchColumn();
    }

    /**
     * Get the current pagination state.
     *
     * @return array{page: int, limit: int, total: int, total_pages: int}
     */
    public function pagination(): array
    {
        $total = $this->count();
        $limit = $this->limit ?? $total;
        $page = $this->page ?? 1;
        $totalPages = $limit > 0 ? (int) ceil($total / $limit) : 1;

        return [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'total_pages' => $totalPages,
        ];
    }

    private function buildJoins(): string
    {
        if ($this->joins === []) {
            return '';
        }

        return ' ' . implode(' ', array_map(fn($j) => "JOIN {$j}", $this->joins));
    }

    private function buildWhere(): string
    {
        if ($this->where === []) {
            return '';
        }

        return ' WHERE ' . implode(' AND ', $this->where);
    }
}

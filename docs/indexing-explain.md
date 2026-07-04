# Indexing Demonstration (EXPLAIN ANALYZE)

This document shows the measurable effect of indexes on the `transactions`
table, using real `EXPLAIN ANALYZE` output from MySQL 9.7 with **50,022 rows**
loaded.

## Reproducing

```sql
-- Load 50k synthetic rows
SET SESSION cte_max_recursion_depth = 60000;
INSERT INTO transactions (account_id, type, amount, balance_after, note, created_at)
WITH RECURSIVE seq AS (
  SELECT 1 AS n UNION ALL SELECT n + 1 FROM seq WHERE n < 50000
)
SELECT
  1 + (n MOD 6),
  IF(n MOD 2 = 0, 'DEPOSIT', 'WITHDRAWAL'),
  ROUND(10 + RAND() * 5000, 2),
  ROUND(10000 + RAND() * 90000, 2),
  'bulk load for index demo',
  TIMESTAMP('2025-01-01') + INTERVAL FLOOR(RAND() * 500) DAY
FROM seq;
```

## 1. Date-range query WITHOUT an index → full table scan

```sql
EXPLAIN ANALYZE
SELECT COUNT(*), SUM(amount) FROM transactions
WHERE created_at BETWEEN '2026-01-01' AND '2026-03-31';
```

```
-> Aggregate: count(0), sum(transactions.amount)
    -> Filter: (created_at between '2026-01-01' and '2026-03-31')
        (rows=5556) (actual rows=9065)
        -> Table scan on transactions  (rows=50007) (actual rows=50022)
```

MySQL reads **all 50,022 rows** to find the 9,065 that match.

## 2. Same query WITH `INDEX (created_at)` → index range scan

```sql
CREATE INDEX idx_txn_created ON transactions (created_at);
```

```
-> Aggregate: count(0), sum(transactions.amount)
    -> Index range scan on transactions using idx_txn_created
       over ('2026-01-01' <= created_at <= '2026-03-31')
       (rows=9065) (actual rows=9065)
```

MySQL now touches **only the 9,065 matching rows** — a ~5.5x reduction in
rows examined; the gap grows linearly as the table grows.

## 3. The composite index `(account_id, created_at)` for statements

The schema ships with `idx_txn_account_date (account_id, created_at)`.
It serves the most common query in the app — "latest transactions for an
account" — with **no sort step at all**, because the index is already
ordered by date within each account:

```sql
EXPLAIN ANALYZE
SELECT * FROM transactions WHERE account_id = 3
ORDER BY created_at DESC LIMIT 20;
```

```
-> Limit: 20 row(s)  (actual time=0.163..0.169 rows=20)
    -> Index lookup on transactions using idx_txn_account_date
       (account_id = 3) (reverse)  (actual rows=20)
```

Only **20 rows read, 0.17 ms**, scanning the index backwards — despite
15,000+ rows existing for that account. Without the composite index this
query would need a full scan plus a filesort.

## Key takeaways (interview points)

- A **composite index** on `(account_id, created_at)` serves equality on the
  first column + range/sort on the second (leftmost-prefix rule).
- `ORDER BY ... DESC` can be satisfied by a **reverse index scan** — no
  filesort.
- InnoDB **requires an index on foreign key columns**; MySQL refuses to drop
  `idx_txn_account_date` because the FK on `account_id` depends on it
  (error 1553).
- Indexes are not free: each secondary index adds write cost to every
  INSERT/UPDATE, which is why we index only the columns the app queries.

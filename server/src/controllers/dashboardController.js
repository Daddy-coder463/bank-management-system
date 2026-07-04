import { pool } from '../config/db.js';

export async function getSummary(req, res, next) {
  try {
    const [[counts]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM customers)                                   AS total_customers,
        (SELECT COUNT(*) FROM accounts WHERE status = 'ACTIVE')            AS total_accounts,
        (SELECT COALESCE(SUM(balance), 0) FROM accounts WHERE status = 'ACTIVE') AS total_deposits,
        (SELECT COUNT(*) FROM loans WHERE status = 'APPROVED')             AS active_loans
    `);

    const [recent] = await pool.query(`
      SELECT id, created_at, account_no, customer_name, type, amount, balance_after
      FROM account_statements
      ORDER BY created_at DESC, id DESC
      LIMIT 8
    `);

    res.json({ summary: counts, recentTransactions: recent });
  } catch (err) {
    next(err);
  }
}

import { pool } from '../config/db.js';

export async function listAccounts(req, res, next) {
  try {
    const { search = '' } = req.query;
    const like = `%${search}%`;
    const [rows] = await pool.query(
      `SELECT a.id, a.account_no, a.type, a.balance, a.status, a.opened_at,
              c.id AS customer_id, c.name AS customer_name,
              b.name AS branch_name
       FROM accounts a
       JOIN customers c ON c.id = a.customer_id
       JOIN branches  b ON b.id = a.branch_id
       WHERE a.account_no LIKE ? OR c.name LIKE ?
       ORDER BY a.opened_at DESC`,
      [like, like]
    );
    res.json({ accounts: rows });
  } catch (err) {
    next(err);
  }
}

export async function listBranches(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT id, code, name FROM branches ORDER BY code');
    res.json({ branches: rows });
  } catch (err) {
    next(err);
  }
}

export async function openAccount(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { customer_id, branch_id, type, initial_deposit = 0 } = req.body;
    if (!customer_id || !branch_id || !type) {
      return res.status(400).json({ error: 'Customer, branch and account type are required' });
    }
    const deposit = Number(initial_deposit) || 0;
    if (deposit < 0) {
      return res.status(400).json({ error: 'Initial deposit cannot be negative' });
    }

    // Account creation + opening deposit must be atomic.
    await conn.beginTransaction();

    // Next sequential 12-digit account number (max + 1, locked).
    const [[{ next_no }]] = await conn.query(
      `SELECT LPAD(COALESCE(MAX(CAST(account_no AS UNSIGNED)), 100000000000) + 1, 12, '0') AS next_no
       FROM accounts FOR UPDATE`
    );

    const [result] = await conn.query(
      'INSERT INTO accounts (account_no, customer_id, branch_id, type, balance) VALUES (?, ?, ?, ?, ?)',
      [next_no, customer_id, branch_id, type, deposit]
    );

    if (deposit > 0) {
      await conn.query(
        `INSERT INTO transactions (account_id, type, amount, balance_after, note)
         VALUES (?, 'DEPOSIT', ?, ?, 'Initial deposit')`,
        [result.insertId, deposit, deposit]
      );
    }

    await conn.commit();
    res.status(201).json({ id: result.insertId, account_no: next_no });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

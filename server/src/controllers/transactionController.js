import { pool } from '../config/db.js';

export async function listTransactions(req, res, next) {
  try {
    const { account_no = '', type = '', from = '', to = '' } = req.query;
    const where = [];
    const params = [];

    if (account_no) {
      where.push('account_no = ?');
      params.push(account_no);
    }
    if (type) {
      where.push('type = ?');
      params.push(type);
    }
    if (from) {
      where.push('created_at >= ?');
      params.push(from);
    }
    if (to) {
      where.push('created_at < DATE_ADD(?, INTERVAL 1 DAY)');
      params.push(to);
    }

    const [rows] = await pool.query(
      `SELECT id, created_at, account_no, customer_name, branch_name,
              type, amount, balance_after, reference_id, note
       FROM account_statements
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY created_at DESC, id DESC
       LIMIT 100`,
      params
    );
    res.json({ transactions: rows });
  } catch (err) {
    next(err);
  }
}

// Deposit and withdraw use an explicit application-level transaction with
// SELECT ... FOR UPDATE row locking. Transfers use the transfer_money
// stored procedure (see db/procedures.sql).
async function moveMoney(req, res, next, direction) {
  const conn = await pool.getConnection();
  try {
    const { account_no, amount, note } = req.body;
    const amt = Number(amount);
    if (!account_no || !amt || amt <= 0) {
      return res.status(400).json({ error: 'Account number and a positive amount are required' });
    }

    await conn.beginTransaction();

    const [rows] = await conn.query(
      'SELECT id, balance, status FROM accounts WHERE account_no = ? FOR UPDATE',
      [account_no]
    );
    const account = rows[0];
    if (!account) {
      await conn.rollback();
      return res.status(404).json({ error: 'Account not found' });
    }
    if (account.status !== 'ACTIVE') {
      await conn.rollback();
      return res.status(400).json({ error: 'Account is not active' });
    }
    if (direction === 'WITHDRAWAL' && account.balance < amt) {
      await conn.rollback();
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const newBalance =
      direction === 'DEPOSIT' ? account.balance + amt : account.balance - amt;

    await conn.query('UPDATE accounts SET balance = ? WHERE id = ?', [newBalance, account.id]);
    await conn.query(
      'INSERT INTO transactions (account_id, type, amount, balance_after, note) VALUES (?, ?, ?, ?, ?)',
      [account.id, direction, amt, newBalance, note || null]
    );

    await conn.commit();
    res.status(201).json({ balance: newBalance });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

export const deposit = (req, res, next) => moveMoney(req, res, next, 'DEPOSIT');
export const withdraw = (req, res, next) => moveMoney(req, res, next, 'WITHDRAWAL');

export async function transfer(req, res, next) {
  try {
    const { from_account_no, to_account_no, amount, note } = req.body;
    const amt = Number(amount);
    if (!from_account_no || !to_account_no || !amt || amt <= 0) {
      return res
        .status(400)
        .json({ error: 'Both account numbers and a positive amount are required' });
    }

    const [resultSets] = await pool.query('CALL transfer_money(?, ?, ?, ?)', [
      from_account_no,
      to_account_no,
      amt,
      note || null,
    ]);
    const reference_id = resultSets[0]?.[0]?.reference_id;
    res.status(201).json({ reference_id });
  } catch (err) {
    next(err);
  }
}

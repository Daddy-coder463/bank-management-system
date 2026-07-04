import { pool } from '../config/db.js';

export async function branchSummary(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM branch_summary ORDER BY code');
    res.json({ branches: rows });
  } catch (err) {
    next(err);
  }
}

export async function pendingLoans(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM loan_outstanding WHERE status = 'PENDING' ORDER BY created_at`
    );
    res.json({ loans: rows });
  } catch (err) {
    next(err);
  }
}

export async function decideLoan(req, res, next) {
  try {
    const { decision } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be APPROVED or REJECTED' });
    }
    const [result] = await pool.query(
      `UPDATE loans SET status = ? WHERE id = ? AND status = 'PENDING'`,
      [decision, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pending loan not found' });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function auditLogs(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT id, table_name, action, record_id, old_value, new_value, changed_at
       FROM audit_logs ORDER BY changed_at DESC, id DESC LIMIT 100`
    );
    res.json({ logs: rows });
  } catch (err) {
    next(err);
  }
}

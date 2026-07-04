import { pool } from '../config/db.js';

export async function listCustomers(req, res, next) {
  try {
    const { search = '' } = req.query;
    const like = `%${search}%`;
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.email, c.phone, c.address, c.created_at,
              COUNT(a.id) AS account_count
       FROM customers c
       LEFT JOIN accounts a ON a.customer_id = c.id
       WHERE c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [like, like, like]
    );
    res.json({ customers: rows });
  } catch (err) {
    next(err);
  }
}

export async function createCustomer(req, res, next) {
  try {
    const { name, email, phone, address } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const [result] = await pool.query(
      'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
      [name, email, phone || null, address || null]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    next(err);
  }
}

export async function updateCustomer(req, res, next) {
  try {
    const { name, email, phone, address } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const [result] = await pool.query(
      'UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
      [name, email, phone || null, address || null, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

export async function deleteCustomer(req, res, next) {
  try {
    // FK ON DELETE RESTRICT protects customers with accounts/loans;
    // the central error handler turns that into a 409.
    const [result] = await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

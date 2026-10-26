import express from 'express';
import { getPool } from '../config/db.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

const ALLOWED_TABLES = ['users', 'vehicles', 'routes', 'route_stops', 'trips', 'bookings'];

// Get list of tables and row counts
router.get('/tables', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    const pool = getPool();
    const tableStats = [];

    for (const table of ALLOWED_TABLES) {
      const [rows] = await pool.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
      tableStats.push({
        table_name: table,
        row_count: rows[0].count
      });
    }

    res.json({
      success: true,
      data: tableStats
    });
  } catch (error) {
    next(error);
  }
});

// Get table schema and rows
router.get('/table/:tableName', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    const { tableName } = req.params;

    if (!ALLOWED_TABLES.includes(tableName)) {
      return res.status(400).json({ success: false, message: 'Invalid or unauthorized table name.' });
    }

    const pool = getPool();

    // 1. Fetch schema definition
    const [columns] = await pool.query(`DESCRIBE \`${tableName}\``);

    // 2. Fetch rows
    const [rows] = await pool.query(`SELECT * FROM \`${tableName}\` ORDER BY id DESC LIMIT 100`);

    res.json({
      success: true,
      table: tableName,
      columns: columns.map(c => ({
        field: c.Field,
        type: c.Type,
        null: c.Null,
        key: c.Key,
        default: c.Default
      })),
      rows
    });
  } catch (error) {
    next(error);
  }
});

export default router;

import { getPool } from '../config/db.js';

export async function getAllVehicles(req, res, next) {
  try {
    const { status, type } = req.query;
    const pool = getPool();

    let query = 'SELECT * FROM vehicles WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      query += ' AND vehicle_type = ?';
      params.push(type);
    }

    query += ' ORDER BY id DESC';
    const [vehicles] = await pool.query(query, params);

    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    next(error);
  }
}

export async function getVehicleById(req, res, next) {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [rows] = await pool.query('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    next(error);
  }
}

export async function createVehicle(req, res, next) {
  try {
    const {
      plate_number,
      model,
      vehicle_type,
      capacity,
      status = 'active',
      fuel_type = 'Electric',
      mileage_km = 0,
      last_serviced_date
    } = req.body;

    if (!plate_number || !model || !vehicle_type || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Plate number, model, vehicle type, and capacity are required.'
      });
    }

    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO vehicles 
        (plate_number, model, vehicle_type, capacity, status, fuel_type, mileage_km, last_serviced_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        plate_number.toUpperCase().trim(),
        model,
        vehicle_type,
        Number(capacity),
        status,
        fuel_type,
        Number(mileage_km),
        last_serviced_date || new Date().toISOString().split('T')[0]
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Vehicle added to fleet successfully.',
      data: { id: result.insertId, plate_number, model, capacity }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A vehicle with this license plate already exists.'
      });
    }
    next(error);
  }
}

export async function updateVehicle(req, res, next) {
  try {
    const { id } = req.params;
    const { status, mileage_km, last_serviced_date, model, capacity } = req.body;
    const pool = getPool();

    const updates = [];
    const params = [];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (mileage_km !== undefined) {
      updates.push('mileage_km = ?');
      params.push(Number(mileage_km));
    }
    if (last_serviced_date !== undefined) {
      updates.push('last_serviced_date = ?');
      params.push(last_serviced_date);
    }
    if (model !== undefined) {
      updates.push('model = ?');
      params.push(model);
    }
    if (capacity !== undefined) {
      updates.push('capacity = ?');
      params.push(Number(capacity));
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields provided for update.' });
    }

    params.push(id);
    const [result] = await pool.query(
      `UPDATE vehicles SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    res.json({ success: true, message: 'Vehicle updated successfully.' });
  } catch (error) {
    next(error);
  }
}

export async function deleteVehicle(req, res, next) {
  try {
    const { id } = req.params;
    const pool = getPool();

    // Check if vehicle has any active trips
    const [trips] = await pool.query(
      'SELECT id FROM trips WHERE vehicle_id = ? AND status IN ("scheduled", "in_transit")',
      [id]
    );

    if (trips.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vehicle currently assigned to active or scheduled trips.'
      });
    }

    const [result] = await pool.query('DELETE FROM vehicles WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    res.json({ success: true, message: 'Vehicle removed from fleet successfully.' });
  } catch (error) {
    next(error);
  }
}

import { getPool } from '../config/db.js';

export async function getAllTrips(req, res, next) {
  try {
    const { status, route_id } = req.query;
    const pool = getPool();

    let query = `
      SELECT 
        t.id,
        t.route_id,
        t.vehicle_id,
        t.driver_id,
        t.departure_time,
        t.arrival_time,
        t.status,
        t.current_stop_id,
        t.available_seats,
        t.fare,
        r.route_name,
        r.origin,
        r.destination,
        r.distance_km,
        r.estimated_duration_mins,
        v.plate_number,
        v.model AS vehicle_model,
        v.vehicle_type,
        v.capacity AS total_capacity,
        v.fuel_type,
        u.name AS driver_name,
        u.phone AS driver_phone,
        cs.stop_name AS current_stop_name,
        cs.stop_order AS current_stop_order
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN users u ON t.driver_id = u.id
      LEFT JOIN route_stops cs ON t.current_stop_id = cs.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (route_id) {
      query += ' AND t.route_id = ?';
      params.push(route_id);
    }

    query += ' ORDER BY t.departure_time DESC';

    const [trips] = await pool.query(query, params);

    res.json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (error) {
    next(error);
  }
}

export async function getTripById(req, res, next) {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [trips] = await pool.query(
      `SELECT 
        t.*,
        r.route_name, r.origin, r.destination, r.distance_km, r.estimated_duration_mins,
        v.plate_number, v.model AS vehicle_model, v.capacity, v.fuel_type,
        u.name AS driver_name, u.phone AS driver_phone,
        cs.stop_name AS current_stop_name, cs.stop_order AS current_stop_order
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN users u ON t.driver_id = u.id
      LEFT JOIN route_stops cs ON t.current_stop_id = cs.id
      WHERE t.id = ?`,
      [id]
    );

    if (trips.length === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    // Also get all route stops
    const [stops] = await pool.query(
      'SELECT * FROM route_stops WHERE route_id = ? ORDER BY stop_order ASC',
      [trips[0].route_id]
    );

    res.json({
      success: true,
      data: {
        ...trips[0],
        stops
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createTrip(req, res, next) {
  try {
    const { route_id, vehicle_id, driver_id, departure_time, fare = 40.00 } = req.body;

    if (!route_id || !vehicle_id || !driver_id || !departure_time) {
      return res.status(400).json({
        success: false,
        message: 'Route, vehicle, driver, and departure time are required.'
      });
    }

    const pool = getPool();

    // 1. Verify vehicle exists and is active
    const [vehicles] = await pool.query('SELECT capacity, status FROM vehicles WHERE id = ?', [vehicle_id]);
    if (vehicles.length === 0) {
      return res.status(404).json({ success: false, message: 'Selected vehicle not found.' });
    }
    if (vehicles[0].status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Vehicle cannot be dispatched. Current status is "${vehicles[0].status}".`
      });
    }

    // 2. Verify driver is role 'driver'
    const [drivers] = await pool.query('SELECT role FROM users WHERE id = ?', [driver_id]);
    if (drivers.length === 0 || drivers[0].role !== 'driver') {
      return res.status(400).json({ success: false, message: 'Selected user is not registered as a driver.' });
    }

    // 3. Find the first stop for this route to set as initial stop
    const [stops] = await pool.query(
      'SELECT id FROM route_stops WHERE route_id = ? ORDER BY stop_order ASC LIMIT 1',
      [route_id]
    );
    const initialStopId = stops.length > 0 ? stops[0].id : null;

    const capacity = vehicles[0].capacity;

    const [result] = await pool.query(
      `INSERT INTO trips 
        (route_id, vehicle_id, driver_id, departure_time, status, current_stop_id, available_seats, fare)
       VALUES (?, ?, ?, ?, 'scheduled', ?, ?, ?)`,
      [route_id, vehicle_id, driver_id, departure_time, initialStopId, capacity, Number(fare)]
    );

    res.status(201).json({
      success: true,
      message: 'Trip scheduled successfully.',
      data: { id: result.insertId, route_id, vehicle_id, departure_time, available_seats: capacity }
    });
  } catch (error) {
    next(error);
  }
}

export async function advanceTripStop(req, res, next) {
  try {
    const { id } = req.params;
    const pool = getPool();

    // Get current trip details
    const [trips] = await pool.query(
      'SELECT id, route_id, current_stop_id, status FROM trips WHERE id = ?',
      [id]
    );

    if (trips.length === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    const trip = trips[0];
    if (trip.status === 'completed' || trip.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Trip is already ${trip.status}.`
      });
    }

    // Get all stops for this route in order
    const [stops] = await pool.query(
      'SELECT id, stop_name, stop_order FROM route_stops WHERE route_id = ? ORDER BY stop_order ASC',
      [trip.route_id]
    );

    const currentIndex = stops.findIndex(s => s.id === trip.current_stop_id);
    const nextIndex = currentIndex + 1;

    if (nextIndex < stops.length) {
      const nextStop = stops[nextIndex];
      await pool.query(
        'UPDATE trips SET current_stop_id = ?, status = "in_transit" WHERE id = ?',
        [nextStop.id, id]
      );
      res.json({
        success: true,
        message: `Trip advanced to stop: ${nextStop.stop_name}`,
        data: {
          current_stop_id: nextStop.id,
          current_stop_name: nextStop.stop_name,
          current_stop_order: nextStop.stop_order,
          status: 'in_transit'
        }
      });
    } else {
      // Final stop reached! Mark trip as completed
      await pool.query(
        'UPDATE trips SET status = "completed", arrival_time = NOW() WHERE id = ?',
        [id]
      );
      res.json({
        success: true,
        message: 'Trip reached final stop and is now marked as Completed.',
        data: { status: 'completed' }
      });
    }
  } catch (error) {
    next(error);
  }
}

export async function updateTripStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['scheduled', 'in_transit', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Choose from: ${validStatuses.join(', ')}`
      });
    }

    const pool = getPool();

    if (status === 'completed') {
      const [result] = await pool.query(
        'UPDATE trips SET status = "completed", arrival_time = NOW() WHERE id = ?',
        [id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Trip not found.' });
      }
      return res.json({ success: true, message: 'Trip successfully marked as Completed by Dispatcher.' });
    }

    const [result] = await pool.query('UPDATE trips SET status = ? WHERE id = ?', [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    res.json({ success: true, message: `Trip status updated to "${status}".` });
  } catch (error) {
    next(error);
  }
}

export async function getDriverTrips(req, res, next) {
  try {
    const driverId = req.user.id;
    const pool = getPool();

    const [trips] = await pool.query(
      `SELECT 
        t.*,
        r.route_name, r.origin, r.destination,
        v.plate_number, v.model AS vehicle_model, v.capacity,
        cs.stop_name AS current_stop_name, cs.stop_order AS current_stop_order
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN route_stops cs ON t.current_stop_id = cs.id
      WHERE t.driver_id = ?
      ORDER BY t.departure_time DESC`,
      [driverId]
    );

    res.json({ success: true, data: trips });
  } catch (error) {
    next(error);
  }
}

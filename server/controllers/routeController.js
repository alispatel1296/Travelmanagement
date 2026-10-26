import { getPool } from '../config/db.js';

export async function getAllRoutes(req, res, next) {
  try {
    const pool = getPool();

    // Fetch all routes
    const [routes] = await pool.query('SELECT * FROM routes ORDER BY id DESC');

    // Fetch all stops
    const [stops] = await pool.query('SELECT * FROM route_stops ORDER BY route_id, stop_order ASC');

    // Group stops under each route
    const stopsByRoute = stops.reduce((acc, stop) => {
      if (!acc[stop.route_id]) acc[stop.route_id] = [];
      acc[stop.route_id].push(stop);
      return acc;
    }, {});

    const routesWithStops = routes.map(route => ({
      ...route,
      stops: stopsByRoute[route.id] || []
    }));

    res.json({
      success: true,
      count: routesWithStops.length,
      data: routesWithStops
    });
  } catch (error) {
    next(error);
  }
}

export async function getRouteById(req, res, next) {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [routes] = await pool.query('SELECT * FROM routes WHERE id = ?', [id]);
    if (routes.length === 0) {
      return res.status(404).json({ success: false, message: 'Route not found.' });
    }

    const [stops] = await pool.query(
      'SELECT * FROM route_stops WHERE route_id = ? ORDER BY stop_order ASC',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...routes[0],
        stops
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function createRoute(req, res, next) {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    const { route_name, origin, destination, distance_km = 10, estimated_duration_mins = 30, stops = [] } = req.body;

    if (!route_name || !origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Route name, origin, and destination are required.'
      });
    }

    await connection.beginTransaction();

    // 1. Insert route
    const [routeResult] = await connection.query(
      'INSERT INTO routes (route_name, origin, destination, distance_km, estimated_duration_mins) VALUES (?, ?, ?, ?, ?)',
      [route_name, origin, destination, Number(distance_km), Number(estimated_duration_mins)]
    );
    const newRouteId = routeResult.insertId;

    // 2. Insert stops if provided
    if (Array.isArray(stops) && stops.length > 0) {
      for (let i = 0; i < stops.length; i++) {
        const stop = stops[i];
        await connection.query(
          'INSERT INTO route_stops (route_id, stop_name, stop_order, minutes_from_origin) VALUES (?, ?, ?, ?)',
          [newRouteId, stop.stop_name || stop, i + 1, Number(stop.minutes_from_origin || (i * 10))]
        );
      }
    } else {
      // Default to origin and destination as stops
      await connection.query(
        'INSERT INTO route_stops (route_id, stop_name, stop_order, minutes_from_origin) VALUES (?, ?, 1, 0), (?, ?, 2, ?)',
        [newRouteId, origin, newRouteId, destination, Number(estimated_duration_mins)]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Transit route and stops created successfully.',
      data: { id: newRouteId, route_name, origin, destination }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

export async function deleteRoute(req, res, next) {
  try {
    const { id } = req.params;
    const pool = getPool();

    const [trips] = await pool.query(
      'SELECT id FROM trips WHERE route_id = ? AND status IN ("scheduled", "in_transit")',
      [id]
    );

    if (trips.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete route associated with active or scheduled trips.'
      });
    }

    const [result] = await pool.query('DELETE FROM routes WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Route not found.' });
    }

    res.json({ success: true, message: 'Route and its stops deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

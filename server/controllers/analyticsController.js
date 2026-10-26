import { getPool } from '../config/db.js';

export async function getDashboardAnalytics(req, res, next) {
  try {
    const pool = getPool();

    // 1. Vehicle counts by status
    const [vehicleStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_vehicles,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_vehicles,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) AS maintenance_vehicles,
        SUM(CASE WHEN status = 'idle' THEN 1 ELSE 0 END) AS idle_vehicles,
        SUM(CASE WHEN fuel_type = 'Electric' THEN 1 ELSE 0 END) AS ev_count
      FROM vehicles
    `);

    // 2. Trip metrics
    const [tripStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_trips,
        SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END) AS live_trips,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS scheduled_trips,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_trips
      FROM trips
    `);

    // 3. Passenger Bookings
    const [bookingStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_bookings,
        SUM(CASE WHEN status = 'boarded' THEN 1 ELSE 0 END) AS boarded_count,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count
      FROM bookings
    `);

    // 4. Financial & Eco-metrics
    const [revenueStats] = await pool.query(`
      SELECT COALESCE(SUM(t.fare), 0) AS total_revenue
      FROM bookings b
      JOIN trips t ON b.trip_id = t.id
      WHERE b.status IN ('confirmed', 'boarded')
    `);

    // 5. Network Infrastructure counts
    const [networkStats] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM routes) AS total_routes,
        (SELECT COUNT(*) FROM route_stops) AS total_stops,
        (SELECT COUNT(*) FROM users WHERE role = 'driver') AS total_drivers,
        (SELECT COUNT(*) FROM users WHERE role = 'passenger') AS total_passengers
    `);

    // Eco metric: Average passenger trip saves ~1.8 kg CO2 compared to private fossil fuel cars
    const activeBookingCount = (Number(bookingStats[0]?.boarded_count) || 0) + (Number(bookingStats[0]?.confirmed_count) || 0);
    const estimatedCo2SavedKg = Math.round(activeBookingCount * 1.8 * 10) / 10;

    res.json({
      success: true,
      data: {
        vehicles: vehicleStats[0],
        trips: tripStats[0],
        bookings: bookingStats[0],
        revenue: Number(revenueStats[0].total_revenue),
        network: networkStats[0],
        co2_saved_kg: estimatedCo2SavedKg
      }
    });
  } catch (error) {
    next(error);
  }
}

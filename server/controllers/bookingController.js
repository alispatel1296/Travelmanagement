import crypto from 'crypto';
import { getPool } from '../config/db.js';

export async function createBooking(req, res, next) {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    const userId = req.user.id;
    const { trip_id, pickup_stop_id, drop_stop_id } = req.body;

    if (!trip_id || !pickup_stop_id || !drop_stop_id) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID, pickup stop, and drop-off stop are required.'
      });
    }

    await connection.beginTransaction();

    // 1. Fetch trip and lock row with FOR UPDATE to prevent race conditions
    const [trips] = await connection.query(
      'SELECT id, route_id, available_seats, status, vehicle_id FROM trips WHERE id = ? FOR UPDATE',
      [trip_id]
    );

    if (trips.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Trip not found.' });
    }

    const trip = trips[0];

    if (trip.status === 'completed' || trip.status === 'cancelled') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot book a trip that is already ${trip.status}.`
      });
    }

    if (trip.available_seats <= 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'Sorry, this trip is fully booked! No seats available.'
      });
    }

    // 2. Prevent duplicate ticket purchases by the same passenger on the same trip
    const [existingBookings] = await connection.query(
      `SELECT id, seat_number, status FROM bookings 
       WHERE user_id = ? AND trip_id = ? AND status IN ('confirmed', 'boarded')`,
      [userId, trip_id]
    );

    if (existingBookings.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `You already hold an active reservation (Seat #${existingBookings[0].seat_number}) for this trip. Duplicate bookings for the same trip are not allowed.`
      });
    }

    // 3. Directional Stop Validation (One-Way Transit Route Rule)
    const [stops] = await connection.query(
      'SELECT id, route_id, stop_name, stop_order FROM route_stops WHERE id IN (?, ?) AND route_id = ?',
      [pickup_stop_id, drop_stop_id, trip.route_id]
    );

    const pickupStop = stops.find(s => Number(s.id) === Number(pickup_stop_id));
    const dropStop = stops.find(s => Number(s.id) === Number(drop_stop_id));

    if (!pickupStop || !dropStop) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid stops selected. Selected stops do not belong to this route.'
      });
    }

    if (pickupStop.stop_order >= dropStop.stop_order) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `One-way transit violation: The vehicle travels sequentially. Drop-off checkpoint ("${dropStop.stop_name}", Stop #${dropStop.stop_order}) must come AFTER pickup checkpoint ("${pickupStop.stop_name}", Stop #${pickupStop.stop_order}).`
      });
    }

    // 4. Fetch vehicle capacity to calculate seat number
    const [vehicles] = await connection.query('SELECT capacity FROM vehicles WHERE id = ?', [trip.vehicle_id]);
    const capacity = vehicles.length > 0 ? vehicles[0].capacity : 40;
    const seatNumber = capacity - trip.available_seats + 1;

    // 5. Atomically decrement available seats
    await connection.query(
      'UPDATE trips SET available_seats = available_seats - 1 WHERE id = ?',
      [trip_id]
    );

    // 6. Generate unique digital boarding pass token
    const tokenSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const boardingToken = `TF-${Date.now().toString().slice(-4)}-${tokenSuffix}`;

    // 7. Insert booking record
    const [bookingResult] = await connection.query(
      `INSERT INTO bookings 
        (trip_id, user_id, pickup_stop_id, drop_stop_id, seat_number, status, boarding_token)
       VALUES (?, ?, ?, ?, ?, 'confirmed', ?)`,
      [trip_id, userId, pickup_stop_id, drop_stop_id, seatNumber, boardingToken]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Seat successfully reserved! Your boarding pass is ready.',
      data: {
        booking_id: bookingResult.insertId,
        trip_id,
        seat_number: seatNumber,
        boarding_token: boardingToken,
        status: 'confirmed'
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

export async function getMyBookings(req, res, next) {
  try {
    const userId = req.user.id;
    const pool = getPool();

    const [bookings] = await pool.query(
      `SELECT 
        b.id,
        b.seat_number,
        b.status AS booking_status,
        b.boarding_token,
        b.booked_at,
        t.id AS trip_id,
        t.departure_time,
        t.status AS trip_status,
        t.fare,
        r.route_name,
        r.origin,
        r.destination,
        v.plate_number,
        v.model AS vehicle_model,
        v.vehicle_type,
        u.name AS driver_name,
        u.phone AS driver_phone,
        p_stop.stop_name AS pickup_stop_name,
        d_stop.stop_name AS drop_stop_name
      FROM bookings b
      JOIN trips t ON b.trip_id = t.id
      JOIN routes r ON t.route_id = r.id
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN users u ON t.driver_id = u.id
      JOIN route_stops p_stop ON b.pickup_stop_id = p_stop.id
      JOIN route_stops d_stop ON b.drop_stop_id = d_stop.id
      WHERE b.user_id = ?
      ORDER BY b.booked_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelBooking(req, res, next) {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const userId = Number(req.user.id);
    const userRole = req.user.role;

    await connection.beginTransaction();

    // Check if booking exists
    const [bookings] = await connection.query(
      'SELECT id, trip_id, user_id, seat_number, status FROM bookings WHERE id = ? FOR UPDATE',
      [id]
    );

    if (bookings.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = bookings[0];

    // Check ownership if not admin
    if (userRole !== 'admin' && Number(booking.user_id) !== userId) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'You are not authorized to cancel this booking.' });
    }

    if (booking.status === 'cancelled') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Booking is already cancelled.' });
    }

    if (booking.status === 'boarded') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Cannot cancel a booking that has already been boarded.' });
    }

    // Update booking status
    await connection.query('UPDATE bookings SET status = "cancelled" WHERE id = ?', [id]);

    // Restore available seat to trip
    await connection.query('UPDATE trips SET available_seats = available_seats + 1 WHERE id = ?', [booking.trip_id]);

    await connection.commit();

    res.json({
      success: true,
      message: `Reservation for Seat #${booking.seat_number} cancelled successfully. Seat restored to available capacity.`,
      cancelled_id: booking.id,
      restored_seat: booking.seat_number
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

export async function verifyBoardingToken(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Boarding token is required.' });
    }

    const pool = getPool();
    const [bookings] = await pool.query(
      `SELECT 
        b.id, b.seat_number, b.status, b.boarding_token,
        u.name AS passenger_name, u.phone AS passenger_phone,
        p_stop.stop_name AS pickup_stop, d_stop.stop_name AS drop_stop
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN route_stops p_stop ON b.pickup_stop_id = p_stop.id
      JOIN route_stops d_stop ON b.drop_stop_id = d_stop.id
      WHERE b.boarding_token = ?`,
      [token.trim().toUpperCase()]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid Boarding Pass Token.' });
    }

    const booking = bookings[0];

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'This booking has been cancelled!' });
    }

    if (booking.status === 'boarded') {
      return res.json({
        success: true,
        already_boarded: true,
        message: 'Passenger was already boarded.',
        data: booking
      });
    }

    // Mark as boarded
    await pool.query('UPDATE bookings SET status = "boarded" WHERE id = ?', [booking.id]);

    res.json({
      success: true,
      message: `Verified! Passenger ${booking.passenger_name} checked in at Seat #${booking.seat_number}.`,
      data: { ...booking, status: 'boarded' }
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllBookings(req, res, next) {
  try {
    const pool = getPool();
    const [bookings] = await pool.query(
      `SELECT 
        b.id,
        b.seat_number,
        b.status AS booking_status,
        b.boarding_token,
        b.booked_at,
        u.id AS passenger_id,
        u.name AS passenger_name,
        u.email AS passenger_email,
        u.phone AS passenger_phone,
        t.id AS trip_id,
        t.departure_time,
        t.fare,
        t.status AS trip_status,
        r.route_name,
        v.plate_number,
        v.model AS vehicle_model,
        d.name AS driver_name,
        p_stop.stop_name AS pickup_stop_name,
        d_stop.stop_name AS drop_stop_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN trips t ON b.trip_id = t.id
      JOIN routes r ON t.route_id = r.id
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN users d ON t.driver_id = d.id
      JOIN route_stops p_stop ON b.pickup_stop_id = p_stop.id
      JOIN route_stops d_stop ON b.drop_stop_id = d_stop.id
      ORDER BY b.booked_at DESC`
    );

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
}

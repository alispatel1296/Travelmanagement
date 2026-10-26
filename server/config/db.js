import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'transfleet_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true' ? {
    ssl: { rejectUnauthorized: false }
  } : {})
};

let pool;

export async function initDatabase() {
  try {
    const dbName = process.env.DB_NAME || 'transfleet_db';

    // 1. In local environments, attempt to create database if not present
    if (!process.env.DATABASE_URL && (process.env.DB_HOST === '127.0.0.1' || !process.env.DB_HOST || process.env.DB_HOST === 'localhost')) {
      try {
        const tempConfig = { ...dbConfig };
        delete tempConfig.database;
        const tempConnection = await mysql.createConnection(tempConfig);
        await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        await tempConnection.end();
      } catch {
        // Safe to ignore if database already exists or permissions restricted
      }
    }

    // 2. Initialize pool with target database
    if (process.env.DATABASE_URL) {
      pool = mysql.createPool(process.env.DATABASE_URL);
    } else {
      pool = mysql.createPool(dbConfig);
    }

    console.log(`[Database] Connected successfully to MySQL database "${dbName}".`);

    // 3. Create tables in proper dependency order
    await createTables();

    // 4. Seed initial realistic demo data if database is empty
    await seedInitialData();

  } catch (error) {
    console.error('[Database] Initialization error:', error.message);
    throw error;
  }
}

async function createTables() {
  const queries = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(120) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin', 'passenger', 'driver') DEFAULT 'passenger',
      phone VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // Vehicles table
    `CREATE TABLE IF NOT EXISTS vehicles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      plate_number VARCHAR(20) NOT NULL UNIQUE,
      model VARCHAR(100) NOT NULL,
      vehicle_type ENUM('Bus', 'Shuttle', 'Van') NOT NULL,
      capacity INT NOT NULL,
      status ENUM('active', 'maintenance', 'idle') DEFAULT 'active',
      fuel_type ENUM('Electric', 'Diesel', 'CNG') DEFAULT 'Electric',
      mileage_km INT DEFAULT 12000,
      last_serviced_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // Routes table
    `CREATE TABLE IF NOT EXISTS routes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      route_name VARCHAR(150) NOT NULL,
      origin VARCHAR(100) NOT NULL,
      destination VARCHAR(100) NOT NULL,
      distance_km DECIMAL(6,2) NOT NULL DEFAULT 15.00,
      estimated_duration_mins INT NOT NULL DEFAULT 45,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,

    // Route Stops table (Ordered sequence)
    `CREATE TABLE IF NOT EXISTS route_stops (
      id INT AUTO_INCREMENT PRIMARY KEY,
      route_id INT NOT NULL,
      stop_name VARCHAR(120) NOT NULL,
      stop_order INT NOT NULL,
      minutes_from_origin INT DEFAULT 0,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
    );`,

    // Trips table (Scheduled runs)
    `CREATE TABLE IF NOT EXISTS trips (
      id INT AUTO_INCREMENT PRIMARY KEY,
      route_id INT NOT NULL,
      vehicle_id INT NOT NULL,
      driver_id INT NOT NULL,
      departure_time DATETIME NOT NULL,
      arrival_time DATETIME,
      status ENUM('scheduled', 'in_transit', 'completed', 'cancelled') DEFAULT 'scheduled',
      current_stop_id INT NULL,
      available_seats INT NOT NULL,
      fare DECIMAL(8,2) DEFAULT 40.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
      FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE RESTRICT,
      FOREIGN KEY (current_stop_id) REFERENCES route_stops(id) ON DELETE SET NULL
    );`,

    // Bookings table
    `CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      trip_id INT NOT NULL,
      user_id INT NOT NULL,
      pickup_stop_id INT NOT NULL,
      drop_stop_id INT NOT NULL,
      seat_number INT NOT NULL,
      status ENUM('confirmed', 'boarded', 'cancelled') DEFAULT 'confirmed',
      boarding_token VARCHAR(32) NOT NULL UNIQUE,
      booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (pickup_stop_id) REFERENCES route_stops(id) ON DELETE RESTRICT,
      FOREIGN KEY (drop_stop_id) REFERENCES route_stops(id) ON DELETE RESTRICT
    );`
  ];

  for (const query of queries) {
    await pool.query(query);
  }
  console.log('[Database] All tables verified/created successfully.');
}

async function seedInitialData() {
  const [existingUsers] = await pool.query('SELECT COUNT(*) as count FROM users');
  if (existingUsers[0].count > 0) {
    return; // Already seeded
  }

  console.log('[Database] Seeding realistic demo data for viva demonstration...');

  // 1. Seed Users
  const adminHash = await bcrypt.hash('admin123', 10);
  const driverHash = await bcrypt.hash('driver123', 10);
  const passHash = await bcrypt.hash('passenger123', 10);

  await pool.query(`
    INSERT INTO users (name, email, password_hash, role, phone) VALUES
    ('Fleet Admin Manager', 'admin@transfleet.com', ?, 'admin', '+91 98765 43210'),
    ('Rajesh Kumar (Driver)', 'driver.rajesh@transfleet.com', ?, 'driver', '+91 98234 11223'),
    ('Vikram Singh (Driver)', 'driver.vikram@transfleet.com', ?, 'driver', '+91 98111 22334'),
    ('Priya Sharma (Student/Rider)', 'priya.sharma@gmail.com', ?, 'passenger', '+91 99887 76655'),
    ('Aarav Patel (Corporate Rider)', 'aarav.patel@gmail.com', ?, 'passenger', '+91 97766 55443')
  `, [adminHash, driverHash, driverHash, passHash, passHash]);

  // 2. Seed Vehicles
  await pool.query(`
    INSERT INTO vehicles (plate_number, model, vehicle_type, capacity, status, fuel_type, mileage_km, last_serviced_date) VALUES
    ('DL-01-AB-1024', 'Volvo B11R Electric Transit', 'Bus', 40, 'active', 'Electric', 18450, CURDATE() - INTERVAL 10 DAY),
    ('DL-01-CD-4590', 'Mercedes-Benz Sprinter 516', 'Van', 18, 'active', 'Diesel', 34200, CURDATE() - INTERVAL 25 DAY),
    ('HR-26-EQ-9912', 'Tata Ultra Urban EV Shuttle', 'Shuttle', 24, 'active', 'Electric', 8900, CURDATE() - INTERVAL 5 DAY),
    ('UP-16-ZZ-3310', 'BharatBenz Tourer Coach', 'Bus', 44, 'maintenance', 'Diesel', 62300, CURDATE() - INTERVAL 60 DAY)
  `);

  // 3. Seed Routes
  const [route1Result] = await pool.query(`
    INSERT INTO routes (route_name, origin, destination, distance_km, estimated_duration_mins) VALUES
    ('Route 101: Central Metro ➔ Cyber City Tech Park', 'Central Metro Hub', 'Cyber City Tech Park', 22.5, 45)
  `);
  const route1Id = route1Result.insertId;

  const [route2Result] = await pool.query(`
    INSERT INTO routes (route_name, origin, destination, distance_km, estimated_duration_mins) VALUES
    ('Route 202: Campus North ➔ Airport Terminal Express', 'Campus North Gate', 'Airport Terminal 3', 31.0, 55)
  `);
  const route2Id = route2Result.insertId;

  // 4. Seed Route Stops
  await pool.query(`
    INSERT INTO route_stops (route_id, stop_name, stop_order, minutes_from_origin) VALUES
    (?, 'Central Metro Hub (Platform 2)', 1, 0),
    (?, 'Sector 14 University Gate', 2, 15),
    (?, 'Infinity IT Towers', 3, 30),
    (?, 'Cyber City Tech Park Gate 4', 4, 45),
    (?, 'Campus North Gate', 1, 0),
    (?, 'Aerocity Metro Interchange', 2, 35),
    (?, 'Airport Terminal 3 Departures', 3, 55)
  `, [route1Id, route1Id, route1Id, route1Id, route2Id, route2Id, route2Id]);

  // Fetch created route stops for linking
  const [stops] = await pool.query('SELECT id, route_id, stop_order FROM route_stops WHERE route_id = ? ORDER BY stop_order ASC', [route1Id]);
  const stop1 = stops[0].id;
  const stop2 = stops[1].id;
  const stop4 = stops[3].id;

  // Fetch created route stops for route 2
  const [route2Stops] = await pool.query('SELECT id FROM route_stops WHERE route_id = ? ORDER BY stop_order ASC', [route2Id]);
  const r2Stop1 = route2Stops[0].id;

  // 5. Seed Scheduled Trips
  // Trip 1: Active in-transit trip assigned to Rajesh Kumar (Driver ID 2), Vehicle 1
  const [trip1Result] = await pool.query(`
    INSERT INTO trips (route_id, vehicle_id, driver_id, departure_time, status, current_stop_id, available_seats, fare) VALUES
    (?, 1, 2, NOW() - INTERVAL 15 MINUTE, 'in_transit', ?, 38, 50.00)
  `, [route1Id, stop2]);
  const trip1Id = trip1Result.insertId;

  // Trip 2: Scheduled upcoming trip assigned to Vikram Singh (Driver ID 3), Vehicle 3
  await pool.query(`
    INSERT INTO trips (route_id, vehicle_id, driver_id, departure_time, status, current_stop_id, available_seats, fare) VALUES
    (?, 3, 3, NOW() + INTERVAL 2 HOUR, 'scheduled', ?, 24, 60.00)
  `, [route2Id, r2Stop1]);

  // 6. Seed Sample Bookings
  await pool.query(`
    INSERT INTO bookings (trip_id, user_id, pickup_stop_id, drop_stop_id, seat_number, status, boarding_token) VALUES
    (?, 4, ?, ?, 7, 'confirmed', 'TF-PASS-7890'),
    (?, 5, ?, ?, 8, 'boarded', 'TF-PASS-4412')
  `, [trip1Id, stop1, stop4, trip1Id, stop1, stop4]);

  console.log('[Database] Demo data successfully seeded!');
}

export function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initDatabase() first.');
  }
  return pool;
}

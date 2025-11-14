// db.js - Database connection file
const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool with SSL enabled
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: true
  }
});

// Use promises instead of callbacks
const promisePool = pool.promise();

// Export for use in other files
module.exports = promisePool;
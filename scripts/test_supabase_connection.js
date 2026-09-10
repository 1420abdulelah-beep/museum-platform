const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
  console.log('Testing connection to Supabase...');
  console.log('Host:', process.env.PGHOST);
  console.log('User:', process.env.PGUSER);
  console.log('Database:', process.env.PGDATABASE);

  // Method 1: Discrete config
  const pool1 = new Pool({
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || 'postgres',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool1.connect();
    console.log('✅ Successfully connected to Supabase using discrete config!');
    const res = await client.query('SELECT NOW() as current_time, version()');
    console.log('PostgreSQL version:', res.rows[0].version);
    console.log('Server time:', res.rows[0].current_time);
    client.release();
    await pool1.end();
  } catch (err) {
    console.error('❌ Connection error with discrete config:', err.message);
  }

  // Method 2: DATABASE_URL
  console.log('\nTesting connection with DATABASE_URL...');
  const pool2 = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool2.connect();
    console.log('✅ Successfully connected to Supabase using DATABASE_URL!');
    client.release();
    await pool2.end();
  } catch (err) {
    console.error('❌ Connection error with DATABASE_URL:', err.message);
  }
}

testConnection();

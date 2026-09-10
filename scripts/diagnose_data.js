const { Pool } = require('pg');
require('dotenv').config();

async function diagnose() {
  console.log('=== 1. Checking Supabase Database Content ===');
  const supabasePool = new Pool({
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || 'postgres',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await supabasePool.connect();
    
    // Users in Supabase
    const users = await client.query('SELECT id, username, name, role, specialty FROM users ORDER BY created_at ASC');
    console.log('\n--- Supabase Users (' + users.rows.length + ') ---');
    users.rows.forEach(u => console.log(`- [${u.username}] ${u.name} (${u.role}) - ${u.specialty}`));

    // Platform Data in Supabase
    const pData = await client.query('SELECT key, updated_by, updated_at FROM platform_data');
    console.log('\n--- Supabase platform_data keys ---');
    pData.rows.forEach(p => console.log(`- Key: ${p.key}, UpdatedBy: ${p.updated_by}, UpdatedAt: ${p.updated_at}`));

    // Check museum_plan content in Supabase
    const planRes = await client.query("SELECT data FROM platform_data WHERE key = 'museum_plan'");
    if (planRes.rows.length > 0) {
      const plan = planRes.rows[0].data;
      console.log('\n--- Supabase museum_plan Sample ---');
      console.log('Museum Name:', plan.museumName || plan.title);
      console.log('Stations count:', (plan.stations || []).length);
      console.log('Tasks count:', (plan.tasks || []).length);
      console.log('Team members in plan:', (plan.teamMembers || []).map(m => m.name || m.id).join(', '));
    }

    // Check pdr_data content in Supabase
    const pdrRes = await client.query("SELECT data FROM platform_data WHERE key = 'pdr_data'");
    if (pdrRes.rows.length > 0) {
      const pdr = pdrRes.rows[0].data;
      console.log('\n--- Supabase pdr_data Sample ---');
      console.log('PDR Project Title:', pdr.projectTitle || pdr.title);
      console.log('PDR Sections count:', (pdr.sections || []).length);
      console.log('Team members in PDR:', (pdr.teamMembers || []).map(m => m.name || m.id).join(', '));
    }

    client.release();
    await supabasePool.end();
  } catch (err) {
    console.error('Supabase check error:', err);
  }

  console.log('\n=== 2. Checking AWS RDS Database Content ===');
  const awsPool = new Pool({
    host: 'ahsaseerah.cluster-c4nwyy0g6z1v.us-east-1.rds.amazonaws.com',
    port: 5432,
    database: 'postgres',
    user: 'ahsaseerah',
    password: 'sayedaly',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    const client = await awsPool.connect();
    
    // Users in AWS
    const users = await client.query('SELECT id, username, name, role, specialty FROM users ORDER BY created_at ASC');
    console.log('\n--- AWS Users (' + users.rows.length + ') ---');
    users.rows.forEach(u => console.log(`- [${u.username}] ${u.name} (${u.role}) - ${u.specialty}`));

    // Platform Data in AWS
    const pData = await client.query('SELECT key, updated_by, updated_at FROM platform_data');
    console.log('\n--- AWS platform_data keys ---');
    pData.rows.forEach(p => console.log(`- Key: ${p.key}, UpdatedBy: ${p.updated_by}, UpdatedAt: ${p.updated_at}`));

    // Check museum_plan in AWS
    const planRes = await client.query("SELECT data FROM platform_data WHERE key = 'museum_plan'");
    if (planRes.rows.length > 0) {
      const plan = planRes.rows[0].data;
      console.log('\n--- AWS museum_plan Sample ---');
      console.log('Museum Name:', plan.museumName || plan.title);
      console.log('Stations count:', (plan.stations || []).length);
      console.log('Tasks count:', (plan.tasks || []).length);
      console.log('Team members in plan:', (plan.teamMembers || []).map(m => m.name || m.id).join(', '));
    }

    // Check pdr_data in AWS
    const pdrRes = await client.query("SELECT data FROM platform_data WHERE key = 'pdr_data'");
    if (pdrRes.rows.length > 0) {
      const pdr = pdrRes.rows[0].data;
      console.log('\n--- AWS pdr_data Sample ---');
      console.log('PDR Project Title:', pdr.projectTitle || pdr.title);
      console.log('PDR Sections count:', (pdr.sections || []).length);
      console.log('Team members in PDR:', (pdr.teamMembers || []).map(m => m.name || m.id).join(', '));
    }

    client.release();
    await awsPool.end();
  } catch (err) {
    console.error('AWS check error:', err.message);
  }
}

diagnose();

/**
 * sync_exact_aws_to_supabase.js
 * 100% Exact 1-to-1 mirror from AWS RDS to Supabase & local project files.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function syncExact() {
  console.log('====================================================');
  console.log('🔄 [Exact 1:1 Mirror] AWS RDS ➡️ Supabase & Local Project');
  console.log('====================================================');

  const awsPool = new Pool({
    host: 'ahsaseerah.cluster-c4nwyy0g6z1v.us-east-1.rds.amazonaws.com',
    port: 5432,
    database: 'postgres',
    user: 'ahsaseerah',
    password: 'sayedaly',
    ssl: { rejectUnauthorized: false }
  });

  const supabasePool = new Pool({
    host: 'db.htznmeemcenghbidxgxb.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Sayedaly@1420',
    ssl: { rejectUnauthorized: false }
  });

  const awsClient = await awsPool.connect();
  const supabaseClient = await supabasePool.connect();

  try {
    // 1. Fetch all AWS Users
    console.log('\n👥 1. Mirroring Users from AWS RDS...');
    const awsUsers = await awsClient.query('SELECT * FROM users ORDER BY created_at ASC');
    console.log(`  -> Found ${awsUsers.rows.length} real users on AWS RDS:`);
    awsUsers.rows.forEach(u => console.log(`     * [${u.username}] ${u.name} (${u.role}) - ${u.specialty}`));

    // Clean Supabase Users table and insert only AWS users
    await supabaseClient.query('DELETE FROM users');
    for (const u of awsUsers.rows) {
      await supabaseClient.query(
        `INSERT INTO users (id, username, name, password, role, specialty, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [u.id, u.username, u.name, u.password, u.role, u.specialty, u.created_at || new Date(), u.updated_at || new Date()]
      );
    }
    console.log('  ✅ Supabase users table is now 100% identical to AWS RDS.');

    // Save exact users to local data/users.json
    const localUsersFile = path.join(__dirname, '..', 'data', 'users.json');
    fs.writeFileSync(localUsersFile, JSON.stringify(awsUsers.rows.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      password: u.password,
      role: u.role,
      specialty: u.specialty,
      createdAt: u.created_at
    })), null, 2), 'utf-8');
    console.log('  ✅ Saved exact AWS users to data/users.json.');

    // 2. Fetch all AWS platform_data
    console.log('\n🏛️ 2. Mirroring platform_data (museum_plan, pdr_data, platform_notes) from AWS RDS...');
    const awsPData = await awsClient.query('SELECT * FROM platform_data');
    console.log(`  -> Found ${awsPData.rows.length} documents on AWS RDS: [${awsPData.rows.map(r => r.key).join(', ')}]`);

    await supabaseClient.query('DELETE FROM platform_data');
    for (const doc of awsPData.rows) {
      await supabaseClient.query(
        `INSERT INTO platform_data (key, data, updated_by, updated_at)
         VALUES ($1, $2, $3, $4)`,
        [doc.key, typeof doc.data === 'string' ? doc.data : JSON.stringify(doc.data), doc.updated_by, doc.updated_at || new Date()]
      );

      // Also save to local data files
      if (doc.key === 'museum_plan') {
        fs.writeFileSync(path.join(__dirname, '..', 'data', 'database.json'), JSON.stringify(doc.data, null, 2), 'utf-8');
        console.log('  ✅ Saved exact AWS museum_plan to data/database.json');
      }
      if (doc.key === 'pdr_data') {
        fs.writeFileSync(path.join(__dirname, '..', 'data', 'pdr_database.json'), JSON.stringify(doc.data, null, 2), 'utf-8');
        console.log('  ✅ Saved exact AWS pdr_data to data/pdr_database.json');
      }
      if (doc.key === 'platform_notes') {
        fs.writeFileSync(path.join(__dirname, '..', 'data', 'platform_notes.json'), JSON.stringify(doc.data, null, 2), 'utf-8');
        console.log('  ✅ Saved exact AWS platform_notes to data/platform_notes.json');
      }
    }
    console.log('  ✅ Supabase platform_data is now 100% identical to AWS RDS.');

    // 3. Fetch all AWS leads
    console.log('\n📩 3. Mirroring leads from AWS RDS...');
    const awsLeads = await awsClient.query('SELECT * FROM leads');
    console.log(`  -> Found ${awsLeads.rows.length} leads on AWS RDS.`);
    await supabaseClient.query('DELETE FROM leads');
    for (const l of awsLeads.rows) {
      await supabaseClient.query(
        `INSERT INTO leads (id, data, received_at) VALUES ($1, $2, $3)`,
        [l.id, typeof l.data === 'string' ? l.data : JSON.stringify(l.data), l.received_at || new Date()]
      );
    }
    fs.writeFileSync(path.join(__dirname, '..', 'data', 'leads.json'), JSON.stringify(awsLeads.rows.map(r => r.data), null, 2), 'utf-8');
    console.log('  ✅ Supabase leads table is now 100% identical to AWS RDS.');

    // 4. Fetch all AWS system_backups
    console.log('\n💾 4. Mirroring system_backups from AWS RDS...');
    const awsBackups = await awsClient.query('SELECT * FROM system_backups');
    console.log(`  -> Found ${awsBackups.rows.length} backups on AWS RDS.`);
    await supabaseClient.query('DELETE FROM system_backups');
    for (const b of awsBackups.rows) {
      await supabaseClient.query(
        `INSERT INTO system_backups (id, filename, timestamp, type, note, size_bytes, data, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          b.id,
          b.filename,
          b.timestamp,
          b.type,
          b.note,
          b.size_bytes,
          typeof b.data === 'string' ? b.data : JSON.stringify(b.data),
          b.created_at || new Date()
        ]
      );
    }
    console.log('  ✅ Supabase system_backups is now 100% identical to AWS RDS.');

    console.log('\n====================================================');
    console.log('🎉 [SUCCESS] Exact 1:1 AWS RDS Mirror completed flawlessly!');
    console.log('====================================================');

  } catch (err) {
    console.error('Sync error:', err);
  } finally {
    awsClient.release();
    supabaseClient.release();
    await awsPool.end();
    await supabasePool.end();
  }
}

syncExact();

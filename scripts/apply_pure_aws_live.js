/**
 * apply_pure_aws_live.js
 * Pulls the exact live database directly from AWS RDS and injects it into Supabase & all files.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function applyPureAws() {
  console.log('===========================================================');
  console.log('⚡ Applying 100% Pure AWS Live Database to Supabase & Web App');
  console.log('===========================================================');

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
    // 1. Users from AWS
    const awsUsers = await awsClient.query('SELECT * FROM users ORDER BY created_at ASC');
    console.log(`\n👥 1. AWS Live Users (${awsUsers.rows.length}):`);
    awsUsers.rows.forEach(u => console.log(`   - [${u.username}] ${u.name} (${u.role}) - ${u.specialty}`));

    await supabaseClient.query('DELETE FROM users');
    for (const u of awsUsers.rows) {
      await supabaseClient.query(
        `INSERT INTO users (id, username, name, password, role, specialty, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [u.id, u.username, u.name, u.password, u.role, u.specialty, u.created_at || new Date(), u.updated_at || new Date()]
      );
    }
    console.log('  ✅ Supabase users table updated.');

    // 2. Platform Data from AWS
    const awsPData = await awsClient.query('SELECT * FROM platform_data');
    console.log(`\n🏛️ 2. AWS Live Documents (${awsPData.rows.length}): [${awsPData.rows.map(r => r.key).join(', ')}]`);

    let museumPlanData = null;
    let pdrData = null;
    let notesData = null;

    await supabaseClient.query('DELETE FROM platform_data');
    for (const doc of awsPData.rows) {
      await supabaseClient.query(
        `INSERT INTO platform_data (key, data, updated_by, updated_at)
         VALUES ($1, $2, $3, $4)`,
        [doc.key, typeof doc.data === 'string' ? doc.data : JSON.stringify(doc.data), doc.updated_by, doc.updated_at || new Date()]
      );

      if (doc.key === 'museum_plan') museumPlanData = doc.data;
      if (doc.key === 'pdr_data') pdrData = doc.data;
      if (doc.key === 'platform_notes') notesData = doc.data;
    }
    console.log('  ✅ Supabase platform_data table updated.');

    // 3. Leads from AWS
    const awsLeads = await awsClient.query('SELECT * FROM leads');
    console.log(`\n📩 3. AWS Live Leads (${awsLeads.rows.length})`);
    await supabaseClient.query('DELETE FROM leads');
    for (const l of awsLeads.rows) {
      await supabaseClient.query(
        `INSERT INTO leads (id, data, received_at) VALUES ($1, $2, $3)`,
        [l.id, typeof l.data === 'string' ? l.data : JSON.stringify(l.data), l.received_at || new Date()]
      );
    }

    // 4. System Backups from AWS
    const awsBackups = await awsClient.query('SELECT * FROM system_backups');
    console.log(`\n💾 4. AWS Live System Backups (${awsBackups.rows.length})`);
    await supabaseClient.query('DELETE FROM system_backups');
    for (const b of awsBackups.rows) {
      await supabaseClient.query(
        `INSERT INTO system_backups (id, filename, timestamp, type, note, size_bytes, data, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [b.id, b.filename, b.timestamp, b.type, b.note, b.size_bytes, typeof b.data === 'string' ? b.data : JSON.stringify(b.data), b.created_at || new Date()]
      );
    }

    // 5. Update local data files
    const DATA_DIR = path.join(__dirname, '..', 'data');
    const JS_DIR = path.join(__dirname, '..', 'js');

    fs.writeFileSync(path.join(DATA_DIR, 'users.json'), JSON.stringify(awsUsers.rows, null, 2), 'utf-8');
    if (museumPlanData) fs.writeFileSync(path.join(DATA_DIR, 'database.json'), JSON.stringify(museumPlanData, null, 2), 'utf-8');
    if (pdrData) fs.writeFileSync(path.join(DATA_DIR, 'pdr_database.json'), JSON.stringify(pdrData, null, 2), 'utf-8');
    if (notesData) fs.writeFileSync(path.join(DATA_DIR, 'platform_notes.json'), JSON.stringify(notesData, null, 2), 'utf-8');

    // 6. Update frontend JS models
    if (museumPlanData) {
      fs.writeFileSync(
        path.join(JS_DIR, 'detailedPlanData.js'),
        `window.App = window.App || {};\nwindow.App.DetailedPlanData = ${JSON.stringify(museumPlanData, null, 2)};\n`,
        'utf-8'
      );
    }

    if (pdrData) {
      fs.writeFileSync(
        path.join(JS_DIR, 'pdrData.js'),
        `window.App = window.App || {};\nwindow.App.PdrData = ${JSON.stringify(pdrData, null, 2)};\n`,
        'utf-8'
      );
    }

    // Update authGuard.js offlineUsers to be ONLY the AWS users
    const sanitizedAuthUsers = awsUsers.rows.map(u => ({
      username: u.username,
      name: u.name,
      role: u.role,
      password: u.password
    }));

    let authGuardCode = fs.readFileSync(path.join(JS_DIR, 'authGuard.js'), 'utf-8');
    authGuardCode = authGuardCode.replace(
      /this\.offlineUsers\s*=\s*\[[\s\S]*?\];/m,
      `this.offlineUsers = ${JSON.stringify(sanitizedAuthUsers, null, 8).trim()};`
    );
    fs.writeFileSync(path.join(JS_DIR, 'authGuard.js'), authGuardCode, 'utf-8');

    // Update teamAdmin.js fallback to be ONLY the AWS users
    let teamAdminCode = fs.readFileSync(path.join(JS_DIR, 'teamAdmin.js'), 'utf-8');
    teamAdminCode = teamAdminCode.replace(
      /this\.users\s*=\s*\[[\s\S]*?\];/m,
      `this.users = ${JSON.stringify(awsUsers.rows, null, 10).trim()};`
    );
    fs.writeFileSync(path.join(JS_DIR, 'teamAdmin.js'), teamAdminCode, 'utf-8');

    console.log('\n===========================================================');
    console.log('🎉 [SUCCESS] All AWS Live Data Applied Everywhere!');
    console.log('===========================================================');

  } finally {
    awsClient.release();
    supabaseClient.release();
    await awsPool.end();
    await supabasePool.end();
  }
}

applyPureAws().catch(console.error);

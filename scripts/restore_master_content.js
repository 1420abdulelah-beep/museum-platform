/**
 * restore_master_content.js
 * Restores the complete 273KB Master Dataset from backup_2026-09-06T17-11-13-593Z.json
 * into Supabase DB, local data files, and frontend JS models.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const MASTER_BACKUP_FILE = path.join(__dirname, '..', 'data', 'backups', 'backup_2026-09-06T17-11-13-593Z.json');
const DATA_DIR = path.join(__dirname, '..', 'data');
const JS_DIR = path.join(__dirname, '..', 'js');

async function restoreMaster() {
  console.log('================================================================');
  console.log('🏛️ [MASTER RESTORE] Restoring Full "سراج الأحساء" Platform Data');
  console.log('================================================================');

  if (!fs.existsSync(MASTER_BACKUP_FILE)) {
    throw new Error('Master backup file not found: ' + MASTER_BACKUP_FILE);
  }

  const backup = JSON.parse(fs.readFileSync(MASTER_BACKUP_FILE, 'utf-8'));
  const masterData = backup.data;

  const planData = masterData.database;
  const pdrData = masterData.pdr;
  const usersData = masterData.users || [];
  const notesData = masterData.notes || [];

  console.log(`- Loaded Museum Plan: ${planData?.metadata?.titleAr || 'OK'}`);
  console.log(`- Loaded PDR Sections: ${(pdrData?.sections || []).length} sections`);
  console.log(`- Loaded Users: ${usersData.length} team members`);

  // 1. Save to local data files
  console.log('\n📁 1. Updating local data/ files...');
  fs.writeFileSync(path.join(DATA_DIR, 'database.json'), JSON.stringify(planData, null, 2), 'utf-8');
  fs.writeFileSync(path.join(DATA_DIR, 'pdr_database.json'), JSON.stringify(pdrData, null, 2), 'utf-8');
  fs.writeFileSync(path.join(DATA_DIR, 'users.json'), JSON.stringify(usersData, null, 2), 'utf-8');
  fs.writeFileSync(path.join(DATA_DIR, 'platform_notes.json'), JSON.stringify(notesData, null, 2), 'utf-8');
  console.log('  ✅ Local JSON files updated.');

  // 2. Update frontend JS data models
  console.log('\n💻 2. Updating frontend JS data models...');
  fs.writeFileSync(
    path.join(JS_DIR, 'detailedPlanData.js'),
    `/**\n * detailedPlanData.js\n * Full Master Dataset: سراج الأحساء\n */\nwindow.App = window.App || {};\nwindow.App.DetailedPlanData = ${JSON.stringify(planData, null, 2)};\n`,
    'utf-8'
  );

  fs.writeFileSync(
    path.join(JS_DIR, 'pdrData.js'),
    `/**\n * pdrData.js\n * Full Master Dataset: وثيقة PDR\n */\nwindow.App = window.App || {};\nwindow.App.PdrData = ${JSON.stringify(pdrData, null, 2)};\n`,
    'utf-8'
  );

  let authGuardCode = fs.readFileSync(path.join(JS_DIR, 'authGuard.js'), 'utf-8');
  authGuardCode = authGuardCode.replace(
    /this\.offlineUsers\s*=\s*\[[\s\S]*?\];/m,
    `this.offlineUsers = ${JSON.stringify(usersData, null, 8).trim()};`
  );
  fs.writeFileSync(path.join(JS_DIR, 'authGuard.js'), authGuardCode, 'utf-8');

  let teamAdminCode = fs.readFileSync(path.join(JS_DIR, 'teamAdmin.js'), 'utf-8');
  teamAdminCode = teamAdminCode.replace(
    /this\.users\s*=\s*\[[\s\S]*?\];/m,
    `this.users = ${JSON.stringify(usersData, null, 10).trim()};`
  );
  fs.writeFileSync(path.join(JS_DIR, 'teamAdmin.js'), teamAdminCode, 'utf-8');
  console.log('  ✅ Frontend JS models updated.');

  // 3. Update Supabase PostgreSQL Database
  console.log('\n☁️ 3. Restoring to Supabase PostgreSQL Database...');
  const pool = new Pool({
    host: process.env.PGHOST || 'db.htznmeemcenghbidxgxb.supabase.co',
    port: parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE || 'postgres',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sayedaly@1420',
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  try {
    // Users
    await client.query('DELETE FROM users');
    for (const u of usersData) {
      await client.query(
        `INSERT INTO users (id, username, name, password, role, specialty, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [u.id || ('usr_' + Date.now()), u.username, u.name, u.password, u.role || 'editor', u.specialty || '', u.createdAt ? new Date(u.createdAt) : new Date(), new Date()]
      );
    }
    console.log(`  -> Restored ${usersData.length} users to Supabase.`);

    // Platform Data
    await client.query(
      `INSERT INTO platform_data (key, data, updated_by, updated_at)
       VALUES ('museum_plan', $1, 'master_restore', NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
      [JSON.stringify(planData)]
    );

    await client.query(
      `INSERT INTO platform_data (key, data, updated_by, updated_at)
       VALUES ('pdr_data', $1, 'master_restore', NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
      [JSON.stringify(pdrData)]
    );

    await client.query(
      `INSERT INTO platform_data (key, data, updated_by, updated_at)
       VALUES ('platform_notes', $1, 'master_restore', NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
      [JSON.stringify(notesData)]
    );
    console.log('  -> Restored museum_plan, pdr_data, platform_notes to Supabase platform_data.');

    console.log('\n================================================================');
    console.log('🎉 [SUCCESS] Complete Master Platform Data Restored 100%!');
    console.log('================================================================\n');
  } finally {
    client.release();
    await pool.end();
  }
}

restoreMaster().catch(err => {
  console.error('Master restore error:', err);
});

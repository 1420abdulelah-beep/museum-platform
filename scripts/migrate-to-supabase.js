/**
 * migrate-to-supabase.js
 * Automated Full Database Migration & Synchronization to Supabase PostgreSQL
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const PDR_DB_FILE = path.join(DATA_DIR, 'pdr_database.json');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const NOTES_FILE = path.join(DATA_DIR, 'platform_notes.json');

const getSupabasePool = () => {
  if (process.env.PGHOST && process.env.PGPASSWORD) {
    return new Pool({
      host: process.env.PGHOST,
      port: parseInt(process.env.PGPORT || '5432', 10),
      database: process.env.PGDATABASE || 'postgres',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    });
  }

  const connString = process.env.DATABASE_URL;
  if (!connString) {
    throw new Error('No DATABASE_URL or PG* variables found in .env');
  }

  return new Pool({
    connectionString: connString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });
};

async function runMigration() {
  console.log('======================================================');
  console.log('🚀 [Supabase Migration] Starting Full Migration to Supabase');
  console.log('======================================================');

  const pool = getSupabasePool();
  let client = null;

  try {
    console.log('⏳ Connecting to Supabase PostgreSQL...');
    client = await pool.connect();
    console.log('✅ Connected successfully to Supabase DB!');

    // 1. Create Tables
    console.log('\n📦 Step 1: Creating & Verifying Schema Tables in Supabase...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'editor',
        specialty VARCHAR(255) DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('  -> Table [users] ready.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS platform_data (
        key VARCHAR(100) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_by VARCHAR(100),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('  -> Table [platform_data] ready.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(64) PRIMARY KEY,
        data JSONB NOT NULL,
        received_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('  -> Table [leads] ready.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS system_backups (
        id VARCHAR(64) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL,
        type VARCHAR(50) NOT NULL,
        note TEXT,
        size_bytes BIGINT,
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('  -> Table [system_backups] ready.');

    // 2. Migrate Users
    console.log('\n👥 Step 2: Migrating Users to Supabase...');
    let users = [];
    if (fs.existsSync(USERS_FILE)) {
      try { users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')); } catch (_) {}
    }
    if (users.length === 0) {
      users = [
        { id: 'usr_admin_1', username: 'admin', name: 'مدير النظام الرئيسي', password: 'admin2026', role: 'admin', specialty: 'الإدارة العامة والحوكمة' },
        { id: 'usr_editor_1', username: 'editor', name: 'محرر ومسؤول المحتوى', password: 'editor2026', role: 'editor', specialty: 'تطوير المحتوى' }
      ];
    }

    let insertedUsersCount = 0;
    for (const u of users) {
      await client.query(
        `INSERT INTO users (id, username, name, password, role, specialty, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (username) DO UPDATE
         SET name = EXCLUDED.name,
             password = EXCLUDED.password,
             role = EXCLUDED.role,
             specialty = EXCLUDED.specialty,
             updated_at = NOW()`,
        [
          u.id || ('usr_' + Date.now()),
          u.username,
          u.name,
          u.password,
          u.role || 'editor',
          u.specialty || '',
          u.createdAt ? new Date(u.createdAt) : new Date(),
          new Date()
        ]
      );
      insertedUsersCount++;
    }
    console.log(`  -> Successfully migrated/updated ${insertedUsersCount} users in Supabase.`);

    // 3. Migrate Museum Plan Data
    console.log('\n🏛️ Step 3: Migrating Museum Plan Data...');
    let planData = null;
    if (fs.existsSync(DB_FILE)) {
      try { planData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')); } catch (_) {}
    }
    if (!planData) {
      try {
        global.window = global;
        require(path.join(__dirname, '..', 'js', 'detailedPlanData.js'));
        if (global.App && global.App.DetailedPlanData) {
          planData = global.App.DetailedPlanData;
        }
      } catch (_) {}
    }

    if (planData) {
      await client.query(
        `INSERT INTO platform_data (key, data, updated_by, updated_at)
         VALUES ('museum_plan', $1, 'supabase_migration', NOW())
         ON CONFLICT (key) DO UPDATE
         SET data = EXCLUDED.data, updated_by = 'supabase_migration', updated_at = NOW()`,
        [JSON.stringify(planData)]
      );
      console.log('  -> Successfully migrated [museum_plan] data to Supabase platform_data.');
    } else {
      console.log('  ⚠️ No plan data found to migrate.');
    }

    // 4. Migrate PDR Data
    console.log('\n📑 Step 4: Migrating PDR Data...');
    let pdrData = null;
    if (fs.existsSync(PDR_DB_FILE)) {
      try { pdrData = JSON.parse(fs.readFileSync(PDR_DB_FILE, 'utf-8')); } catch (_) {}
    }
    if (!pdrData) {
      try {
        global.window = global;
        require(path.join(__dirname, '..', 'js', 'pdrData.js'));
        if (global.App && global.App.PdrData) {
          pdrData = global.App.PdrData;
        }
      } catch (_) {}
    }

    if (pdrData) {
      await client.query(
        `INSERT INTO platform_data (key, data, updated_by, updated_at)
         VALUES ('pdr_data', $1, 'supabase_migration', NOW())
         ON CONFLICT (key) DO UPDATE
         SET data = EXCLUDED.data, updated_by = 'supabase_migration', updated_at = NOW()`,
        [JSON.stringify(pdrData)]
      );
      console.log('  -> Successfully migrated [pdr_data] to Supabase platform_data.');
    } else {
      console.log('  ⚠️ No PDR data found to migrate.');
    }

    // 5. Migrate Platform Notes
    console.log('\n📝 Step 5: Migrating Platform Notes...');
    let notesData = [];
    if (fs.existsSync(NOTES_FILE)) {
      try { notesData = JSON.parse(fs.readFileSync(NOTES_FILE, 'utf-8')); } catch (_) {}
    }
    if (notesData) {
      await client.query(
        `INSERT INTO platform_data (key, data, updated_by, updated_at)
         VALUES ('platform_notes', $1, 'supabase_migration', NOW())
         ON CONFLICT (key) DO UPDATE
         SET data = EXCLUDED.data, updated_by = 'supabase_migration', updated_at = NOW()`,
        [JSON.stringify(notesData)]
      );
      console.log('  -> Successfully migrated [platform_notes] to Supabase platform_data.');
    }

    // 6. Migrate Leads
    console.log('\n📩 Step 6: Migrating Leads & Inquiries...');
    let leads = [];
    if (fs.existsSync(LEADS_FILE)) {
      try { leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8')); } catch (_) {}
    }
    let insertedLeads = 0;
    if (Array.isArray(leads) && leads.length > 0) {
      for (const lead of leads) {
        const leadId = lead.id || ('lead_' + Date.now());
        await client.query(
          `INSERT INTO leads (id, data, received_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
          [leadId, JSON.stringify(lead), lead.receivedAt ? new Date(lead.receivedAt) : new Date()]
        );
        insertedLeads++;
      }
      console.log(`  -> Successfully migrated ${insertedLeads} leads to Supabase.`);
    } else {
      console.log('  -> No leads found to migrate.');
    }

    // 7. Create Supabase Initial Snapshot Backup
    console.log('\n💾 Step 7: Creating Migration Backup Snapshot...');
    const backupId = 'bk_supabase_init_' + Date.now();
    const backupData = {
      database: planData,
      pdr: pdrData,
      users: users,
      leads: leads,
      notes: notesData
    };
    await client.query(
      `INSERT INTO system_backups (id, filename, timestamp, type, note, size_bytes, data, created_at)
       VALUES ($1, $2, NOW(), 'supabase_migration', 'النسخة التأسيسية بعد الهجرة إلى Supabase', $3, $4, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [backupId, 'backup_supabase_init.json', Buffer.byteLength(JSON.stringify(backupData)), JSON.stringify(backupData)]
    );
    console.log('  -> Created Supabase initial snapshot backup.');

    // 8. Summary & Verification
    console.log('\n======================================================');
    console.log('📊 Migration Summary & Verification Report:');
    console.log('======================================================');

    const usersCountRes = await client.query('SELECT COUNT(*) FROM users');
    const platformDataRes = await client.query('SELECT key, updated_at FROM platform_data');
    const leadsCountRes = await client.query('SELECT COUNT(*) FROM leads');
    const backupsCountRes = await client.query('SELECT COUNT(*) FROM system_backups');

    console.log(`- Users Table: ${usersCountRes.rows[0].count} records`);
    console.log(`- Platform Data Keys: ${platformDataRes.rows.map(r => r.key).join(', ')}`);
    console.log(`- Leads Table: ${leadsCountRes.rows[0].count} records`);
    console.log(`- System Backups Table: ${backupsCountRes.rows[0].count} records`);

    console.log('======================================================');
    console.log('🎉 [SUCCESS] All data has been migrated to Supabase successfully!');
    console.log('======================================================\n');

  } catch (err) {
    console.error('\n❌ [Migration Error]:', err);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runMigration();

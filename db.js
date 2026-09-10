/**
 * db.js - Resilient Database Layer for Museum Platform
 * Supports both PostgreSQL (AWS RDS / Supabase / Neon / Local) and Local File Fallback
 */

const fs = require('fs');
const path = require('path');

// Optional dotenv loading if file exists
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  }
} catch (_) {}

let pg = null;
try {
  pg = require('pg');
} catch (e) {
  console.warn('⚠️ [DB] "pg" module not installed. Running in JSON file fallback mode.');
}

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const PDR_DB_FILE = path.join(DATA_DIR, 'pdr_database.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const NOTES_FILE = path.join(DATA_DIR, 'platform_notes.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

// Ensure local directories exist for backup & fallback
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (_) {}
}
if (!fs.existsSync(BACKUPS_DIR)) {
  try { fs.mkdirSync(BACKUPS_DIR, { recursive: true }); } catch (_) {}
}

let pool = null;
let usePostgres = false;
let dbInitPromise = null;

// Determine PostgreSQL connection configuration (Supabase / Neon / AWS / Local)
const getPgConfig = () => {
  // 1. Check discrete environment variables (Most reliable for passwords with special chars like @)
  const host = process.env.PGHOST || process.env.RDS_HOSTNAME;
  if (host) {
    const isLocalhost = host === 'localhost' || host === '127.0.0.1';
    return {
      host,
      port: parseInt(process.env.PGPORT || process.env.RDS_PORT || '5432', 10),
      database: process.env.PGDATABASE || process.env.RDS_DB_NAME || 'postgres',
      user: process.env.PGUSER || process.env.RDS_USERNAME || 'postgres',
      password: process.env.PGPASSWORD || process.env.RDS_PASSWORD || '',
      ssl: isLocalhost || process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false }
    };
  }

  // 2. Check direct DATABASE_URL / SUPABASE connection strings
  const connString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.PG_URL || process.env.SUPABASE_DATABASE_URL;
  if (connString) {
    const isLocalhost = connString.includes('localhost') || connString.includes('127.0.0.1');
    return {
      connectionString: connString,
      ssl: isLocalhost || process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false }
    };
  }

  return null;
};

// Initialize schema and seed data into PostgreSQL
const initPgSchema = async (client) => {
  console.log('🔄 [DB] Initializing PostgreSQL Schema & Tables...');

  // 1. Users Table
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

  // 2. Platform Central Key-Value JSON Documents Table (Museum Plan & PDR)
  await client.query(`
    CREATE TABLE IF NOT EXISTS platform_data (
      key VARCHAR(100) PRIMARY KEY,
      data JSONB NOT NULL,
      updated_by VARCHAR(100),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 3. Leads & Inquiries Table
  await client.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id VARCHAR(64) PRIMARY KEY,
      data JSONB NOT NULL,
      received_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 4. System Backups & Snapshots Table
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

  console.log('✅ [DB] PostgreSQL Tables Verified.');

  // Auto-seed: Users
  const userCountRes = await client.query('SELECT COUNT(*) FROM users');
  if (parseInt(userCountRes.rows[0].count, 10) === 0) {
    console.log('🌱 [DB] Seeding users into PostgreSQL...');
    let initialUsers = [];
    if (fs.existsSync(USERS_FILE)) {
      try { initialUsers = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')); } catch (_) {}
    }
    if (!initialUsers || initialUsers.length === 0) {
      initialUsers = [
        { id: 'usr_admin_1', username: 'admin', name: 'مدير النظام الرئيسي', password: 'admin2026', role: 'admin', specialty: 'إدارة عامة' },
        { id: 'usr_editor_1', username: 'editor', name: 'محرر المحتوى والمهام', password: 'editor2026', role: 'editor', specialty: 'تطوير المحتوى' }
      ];
    }
    for (const u of initialUsers) {
      await client.query(
        `INSERT INTO users (id, username, name, password, role, specialty, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (username) DO NOTHING`,
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
    }
    console.log(`✅ [DB] Seeded ${initialUsers.length} users into PostgreSQL.`);
  }

  // Auto-seed: Museum Plan Data
  const planCheck = await client.query("SELECT 1 FROM platform_data WHERE key = 'museum_plan'");
  if (planCheck.rowCount === 0) {
    console.log('🌱 [DB] Seeding Museum Plan data into PostgreSQL...');
    let planData = null;
    if (fs.existsSync(DB_FILE)) {
      try { planData = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')); } catch (_) {}
    }
    if (!planData) {
      try {
        global.window = global;
        require(path.join(__dirname, 'js', 'detailedPlanData.js'));
        if (global.App && global.App.DetailedPlanData) {
          planData = global.App.DetailedPlanData;
        }
      } catch (_) {}
    }
    if (planData) {
      await client.query(
        `INSERT INTO platform_data (key, data, updated_by, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        ['museum_plan', JSON.stringify(planData), 'system_seeder']
      );
      console.log('✅ [DB] Seeded Museum Plan into PostgreSQL platform_data.');
    }
  }

  // Auto-seed: PDR Data
  const pdrCheck = await client.query("SELECT 1 FROM platform_data WHERE key = 'pdr_data'");
  if (pdrCheck.rowCount === 0) {
    console.log('🌱 [DB] Seeding PDR document data into PostgreSQL...');
    let pdrData = null;
    if (fs.existsSync(PDR_DB_FILE)) {
      try { pdrData = JSON.parse(fs.readFileSync(PDR_DB_FILE, 'utf-8')); } catch (_) {}
    }
    if (!pdrData) {
      try {
        global.window = global;
        require(path.join(__dirname, 'js', 'pdrData.js'));
        if (global.App && global.App.PdrData) {
          pdrData = global.App.PdrData;
        }
      } catch (_) {}
    }
    if (pdrData) {
      await client.query(
        `INSERT INTO platform_data (key, data, updated_by, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        ['pdr_data', JSON.stringify(pdrData), 'system_seeder']
      );
      console.log('✅ [DB] Seeded PDR document into PostgreSQL platform_data.');
    }
  }

  // Auto-seed: Leads
  const leadsCountRes = await client.query('SELECT COUNT(*) FROM leads');
  if (parseInt(leadsCountRes.rows[0].count, 10) === 0 && fs.existsSync(LEADS_FILE)) {
    try {
      const leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
      if (Array.isArray(leads) && leads.length > 0) {
        for (const lead of leads) {
          await client.query(
            `INSERT INTO leads (id, data, received_at) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
            [lead.id || ('lead_' + Date.now()), JSON.stringify(lead), lead.receivedAt ? new Date(lead.receivedAt) : new Date()]
          );
        }
        console.log(`✅ [DB] Seeded ${leads.length} leads into PostgreSQL.`);
      }
    } catch (_) {}
  }

  // Auto-seed: Platform Notes
  const notesCheck = await client.query("SELECT 1 FROM platform_data WHERE key = 'platform_notes'");
  if (notesCheck.rowCount === 0 && fs.existsSync(NOTES_FILE)) {
    try {
      const notes = JSON.parse(fs.readFileSync(NOTES_FILE, 'utf-8'));
      if (notes) {
        await client.query(
          `INSERT INTO platform_data (key, data, updated_by, updated_at)
           VALUES ('platform_notes', $1, $2, NOW())
           ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
          [JSON.stringify(notes), 'system_seeder']
        );
        console.log('✅ [DB] Seeded Platform Notes into PostgreSQL platform_data.');
      }
    } catch (_) {}
  }
};

// Initialize the Database Connection
const initDatabase = async () => {
  const pgConfig = getPgConfig();

  if (pg && pgConfig) {
    try {
      console.log('🔌 [DB] Connecting to PostgreSQL at:', pgConfig.host || (pgConfig.connectionString ? 'DATABASE_URL' : 'unknown'));
      pool = new pg.Pool({
        ...pgConfig,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 8000
      });

      pool.on('error', (err) => {
        console.error('⚠️ [DB] Unexpected PostgreSQL pool error:', err.message);
      });

      const client = await pool.connect();
      try {
        await initPgSchema(client);
        usePostgres = true;
        console.log('🚀 [DB] PostgreSQL database successfully connected and initialized.');
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('❌ [DB] Failed to connect to PostgreSQL:', err.message);
      console.log('📁 [DB] Falling back to local JSON file storage.');
      usePostgres = false;
      if (pool) {
        try { await pool.end(); } catch (_) {}
        pool = null;
      }
    }
  } else {
    console.log('📁 [DB] No PostgreSQL configuration detected (DATABASE_URL / PGHOST). Operating in local JSON file mode.');
    usePostgres = false;
  }
};

// Start initialization once
dbInitPromise = initDatabase();

const ensureReady = async () => {
  if (dbInitPromise) await dbInitPromise;
};

// ==========================================
// 1. Users CRUD Operations
// ==========================================

const getUsers = async () => {
  await ensureReady();
  if (usePostgres && pool) {
    try {
      const res = await pool.query('SELECT id, username, name, password, role, specialty, created_at as "createdAt", updated_at as "updatedAt" FROM users ORDER BY created_at ASC');
      return res.rows;
    } catch (err) {
      console.error('DB error getUsers, fallback to file:', err.message);
    }
  }

  // File fallback
  if (fs.existsSync(USERS_FILE)) {
    try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')); } catch (_) {}
  }
  return [];
};

const getUserByUsername = async (username) => {
  await ensureReady();
  if (!username) return null;
  const uname = username.trim().toLowerCase();

  if (usePostgres && pool) {
    try {
      const res = await pool.query(
        'SELECT id, username, name, password, role, specialty, created_at as "createdAt", updated_at as "updatedAt" FROM users WHERE LOWER(username) = $1',
        [uname]
      );
      if (res.rows.length > 0) return res.rows[0];
    } catch (err) {
      console.error('DB error getUserByUsername, fallback to file:', err.message);
    }
  }

  const users = await getUsers();
  return users.find(u => u.username && u.username.toLowerCase() === uname) || null;
};

const saveUser = async (userData) => {
  await ensureReady();
  const username = userData.username.trim();
  const name = userData.name.trim();
  const role = userData.role;
  const specialty = (userData.specialty || '').trim();
  const password = userData.password ? userData.password.trim() : null;

  if (usePostgres && pool) {
    try {
      const existing = await getUserByUsername(username);
      if (existing) {
        if (password) {
          await pool.query(
            'UPDATE users SET name = $1, role = $2, specialty = $3, password = $4, updated_at = NOW() WHERE LOWER(username) = $5',
            [name, role, specialty, password, username.toLowerCase()]
          );
        } else {
          await pool.query(
            'UPDATE users SET name = $1, role = $2, specialty = $3, updated_at = NOW() WHERE LOWER(username) = $4',
            [name, role, specialty, username.toLowerCase()]
          );
        }
      } else {
        const id = userData.id || ('usr_' + Date.now());
        await pool.query(
          `INSERT INTO users (id, username, name, password, role, specialty, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [id, username, name, password || 'editor2026', role, specialty]
        );
      }
      return true;
    } catch (err) {
      console.error('DB error saveUser:', err.message);
      throw err;
    }
  }

  // File fallback
  let users = [];
  if (fs.existsSync(USERS_FILE)) {
    try { users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')); } catch (_) {}
  }
  const idx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  if (idx >= 0) {
    users[idx].name = name;
    users[idx].role = role;
    if (specialty) users[idx].specialty = specialty;
    if (password) users[idx].password = password;
    users[idx].updatedAt = new Date().toISOString();
  } else {
    users.push({
      id: userData.id || ('usr_' + Date.now()),
      username,
      name,
      password: password || 'editor2026',
      role,
      specialty: specialty || 'عضو فريق',
      createdAt: new Date().toISOString()
    });
  }
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  
  // Background sync teamMembers in database.json and pdr_database.json
  setTimeout(() => {
    syncOrphanedAssignments().catch(err => console.warn('Background sync error:', err));
  }, 100);

  return true;
};

const cascadeUserDeletion = async (deletedUser, reassignTo = null) => {
  try {
    const deletedIdentifiers = [
      deletedUser.username?.toLowerCase(),
      deletedUser.name?.toLowerCase(),
      deletedUser.id?.toLowerCase()
    ].filter(Boolean);

    const replacementName = reassignTo ? (reassignTo.name || reassignTo.username) : "غير مسند";
    const replacementId = reassignTo ? (reassignTo.id || reassignTo.username) : "unassigned";

    // 1. Update Museum Plan
    let plan = await getPlanData();
    if (plan) {
      let changed = false;

      // Clean team members
      if (Array.isArray(plan.teamMembers)) {
        const initialLen = plan.teamMembers.length;
        plan.teamMembers = plan.teamMembers.filter(m => 
          !deletedIdentifiers.includes(m.id?.toLowerCase()) &&
          !deletedIdentifiers.includes(m.name?.toLowerCase())
        );
        if (plan.teamMembers.length !== initialLen) changed = true;
      }

      // Helper to clean array assignees
      const cleanAssignees = (arr) => {
        if (!Array.isArray(arr)) return;
        arr.forEach(item => {
          if (item && item.assignee && deletedIdentifiers.includes(item.assignee.toLowerCase())) {
            item.assignee = replacementName;
            changed = true;
          }
        });
      };

      cleanAssignees(plan.tasks);
      cleanAssignees(plan.artifacts);
      cleanAssignees(plan.schools);
      cleanAssignees(plan.scenes);
      cleanAssignees(plan.decisions);

      if (changed) {
        await savePlanData(plan, 'system-cascade-cleanup');
        console.log(`🧹 [DB] Cascade cleaned assignments for deleted user '${deletedUser.username}' in Museum Plan.`);
      }
    }

    // 2. Update PDR Data
    let pdr = await getPdrData();
    if (pdr) {
      let pdrChanged = false;

      // Clean team members
      if (Array.isArray(pdr.teamMembers)) {
        const initialLen = pdr.teamMembers.length;
        pdr.teamMembers = pdr.teamMembers.filter(m =>
          !deletedIdentifiers.includes(m.id?.toLowerCase()) &&
          !deletedIdentifiers.includes(m.username?.toLowerCase()) &&
          !deletedIdentifiers.includes(m.name?.toLowerCase())
        );
        if (pdr.teamMembers.length !== initialLen) pdrChanged = true;
      }

      // Clean sections and sub-items
      if (Array.isArray(pdr.sections)) {
        pdr.sections.forEach(sec => {
          if (sec.ownerId && deletedIdentifiers.includes(sec.ownerId.toLowerCase())) {
            sec.ownerId = replacementId;
            pdrChanged = true;
          }
          if (Array.isArray(sec.items)) {
            sec.items.forEach(item => {
              if (item.assignedTo && deletedIdentifiers.includes(item.assignedTo.toLowerCase())) {
                item.assignedTo = replacementId;
                pdrChanged = true;
              }
            });
          }
        });
      }

      if (pdrChanged) {
        await savePdrData(pdr, 'system-cascade-cleanup');
        console.log(`🧹 [DB] Cascade cleaned assignments for deleted user '${deletedUser.username}' in PDR.`);
      }
    }
  } catch (err) {
    console.error('Error in cascadeUserDeletion:', err);
  }
};

const syncOrphanedAssignments = async () => {
  await ensureReady();
  try {
    const activeUsers = await getUsers();
    const validIds = new Set();
    const validNames = new Set();
    const validUsernames = new Set();

    activeUsers.forEach(u => {
      if (u.id) validIds.add(u.id.toLowerCase());
      if (u.username) validUsernames.add(u.username.toLowerCase());
      if (u.name) validNames.add(u.name.trim().toLowerCase());
    });

    const isAuthorizedAssignee = (val) => {
      if (!val || val === "غير مسند" || val === "unassigned" || val === "لم يحدد") return true;
      const clean = val.trim().toLowerCase();
      return validIds.has(clean) || validUsernames.has(clean) || validNames.has(clean);
    };

    // 1. Sync PDR Sections & Items
    let pdr = await getPdrData();
    let pdrModified = false;

    if (pdr && Array.isArray(pdr.sections)) {
      pdr.sections.forEach(sec => {
        // If ownerId is a legacy ID or deleted user, check if valid
        if (sec.ownerId && !isAuthorizedAssignee(sec.ownerId)) {
          console.log(`🔄 [SYNC] Resetting orphaned ownerId '${sec.ownerId}' in section ${sec.number} to 'unassigned'`);
          sec.ownerId = "unassigned";
          pdrModified = true;
        }

        if (Array.isArray(sec.items)) {
          sec.items.forEach(item => {
            if (item.assignedTo && !isAuthorizedAssignee(item.assignedTo)) {
              console.log(`🔄 [SYNC] Resetting orphaned assignedTo '${item.assignedTo}' in item ${item.id} to 'unassigned'`);
              item.assignedTo = "unassigned";
              pdrModified = true;
            }
          });
        }
      });

      // Sync PDR teamMembers list to match active users
      if (Array.isArray(pdr.teamMembers)) {
        pdr.teamMembers = activeUsers.map(u => ({
          id: u.username || u.id,
          name: u.name || u.username,
          role: u.specialty || (u.role === "admin" ? "مدير النظام (Admin)" : "محرر ومسؤول مهام (Editor)"),
          department: u.role === "admin" ? "الإدارة العامة والحوكمة" : "فريق التنفيذ والمحتوى",
          avatar: u.role === "admin" ? "👑" : "👨‍💼",
          email: `${u.username}@seraj.sa`,
          status: "active"
        }));
        pdrModified = true;
      }

      if (pdrModified) {
        await savePdrData(pdr, 'system-orphan-sync');
        console.log('✅ [SYNC] PDR assignments successfully synchronized with active users.');
      }
    }

    // 2. Sync Museum Plan Tasks & Items
    let plan = await getPlanData();
    let planModified = false;

    if (plan) {
      const deepCleanAssignees = (obj, path = '') => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) {
          obj.forEach((child, i) => deepCleanAssignees(child, `${path}[${i}]`));
          return;
        }
        if (obj.assignee && !isAuthorizedAssignee(obj.assignee)) {
          console.log(`🔄 [SYNC] Resetting orphaned assignee '${obj.assignee}' at ${path}.assignee to 'غير مسند'`);
          obj.assignee = "غير مسند";
          planModified = true;
        }
        for (const key of Object.keys(obj)) {
          if (key !== 'teamMembers') {
            deepCleanAssignees(obj[key], path ? `${path}.${key}` : key);
          }
        }
      };

      deepCleanAssignees(plan);

      if (Array.isArray(plan.teamMembers)) {
        plan.teamMembers = activeUsers.map(u => ({
          id: u.username || u.id,
          name: u.name || u.username,
          role: u.specialty || (u.role === "admin" ? "مدير النظام (Admin)" : "محرر ومسؤول مهام (Editor)"),
          track: u.role === "admin" ? "إشراف عام" : "تنفيذ ومحتوى",
          email: `${u.username}@seraj.sa`,
          phone: "+966 50 000 0000",
          bio: u.specialty || "عضو فريق العمل المعتمد"
        }));
        planModified = true;
      }

      if (planModified) {
        await savePlanData(plan, 'system-orphan-sync');
        console.log('✅ [SYNC] Museum Plan assignments successfully synchronized with active users.');
      }
    }

    return { success: true, pdrSynced: pdrModified, planSynced: planModified };
  } catch (err) {
    console.error('Error in syncOrphanedAssignments:', err);
    return { success: false, error: err.message };
  }
};

const deleteUser = async (username, reassignTo = null) => {
  await ensureReady();
  const uname = username.trim().toLowerCase();

  let targetUser = null;
  const currentUsers = await getUsers();
  targetUser = currentUsers.find(u => u.username.toLowerCase() === uname);

  if (usePostgres && pool) {
    try {
      await pool.query('DELETE FROM users WHERE LOWER(username) = $1', [uname]);
      if (targetUser) {
        await cascadeUserDeletion(targetUser, reassignTo);
      }
      return true;
    } catch (err) {
      console.error('DB error deleteUser:', err.message);
      throw err;
    }
  }

  // File fallback
  let users = [];
  if (fs.existsSync(USERS_FILE)) {
    try { users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')); } catch (_) {}
  }
  users = users.filter(u => u.username.toLowerCase() !== uname);
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');

  if (targetUser) {
    await cascadeUserDeletion(targetUser, reassignTo);
  }
  return true;
};

// ==========================================
// 2. Museum Plan Data CRUD Operations
// ==========================================

const getPlanData = async () => {
  await ensureReady();
  if (usePostgres && pool) {
    try {
      const res = await pool.query("SELECT data FROM platform_data WHERE key = 'museum_plan'");
      if (res.rows.length > 0 && res.rows[0].data) {
        return res.rows[0].data;
      }
    } catch (err) {
      console.error('DB error getPlanData, fallback to file:', err.message);
    }
  }

  if (fs.existsSync(DB_FILE)) {
    try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')); } catch (_) {}
  }
  return null;
};

const savePlanData = async (data, updatedBy = 'unknown') => {
  await ensureReady();
  // Write to local file as immediate snapshot & backup
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (_) {}

  if (usePostgres && pool) {
    try {
      await pool.query(
        `INSERT INTO platform_data (key, data, updated_by, updated_at)
         VALUES ('museum_plan', $1, $2, NOW())
         ON CONFLICT (key) DO UPDATE
         SET data = EXCLUDED.data, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
        [JSON.stringify(data), updatedBy]
      );
      return true;
    } catch (err) {
      console.error('DB error savePlanData:', err.message);
      throw err;
    }
  }
  return true;
};

// ==========================================
// 3. PDR Project Data CRUD Operations
// ==========================================

const getPdrData = async () => {
  await ensureReady();
  if (usePostgres && pool) {
    try {
      const res = await pool.query("SELECT data FROM platform_data WHERE key = 'pdr_data'");
      if (res.rows.length > 0 && res.rows[0].data) {
        return res.rows[0].data;
      }
    } catch (err) {
      console.error('DB error getPdrData, fallback to file:', err.message);
    }
  }

  if (fs.existsSync(PDR_DB_FILE)) {
    try { return JSON.parse(fs.readFileSync(PDR_DB_FILE, 'utf-8')); } catch (_) {}
  }
  return null;
};

const savePdrData = async (data, updatedBy = 'unknown') => {
  await ensureReady();
  try {
    fs.writeFileSync(PDR_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (_) {}

  if (usePostgres && pool) {
    try {
      await pool.query(
        `INSERT INTO platform_data (key, data, updated_by, updated_at)
         VALUES ('pdr_data', $1, $2, NOW())
         ON CONFLICT (key) DO UPDATE
         SET data = EXCLUDED.data, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
        [JSON.stringify(data), updatedBy]
      );
      return true;
    } catch (err) {
      console.error('DB error savePdrData:', err.message);
      throw err;
    }
  }
  return true;
};

// ==========================================
// 4. Leads CRUD Operations
// ==========================================

const getLeads = async () => {
  await ensureReady();
  if (usePostgres && pool) {
    try {
      const res = await pool.query('SELECT data, received_at FROM leads ORDER BY received_at DESC');
      return res.rows.map(r => ({ ...r.data, receivedAt: r.received_at }));
    } catch (err) {
      console.error('DB error getLeads, fallback to file:', err.message);
    }
  }

  if (fs.existsSync(LEADS_FILE)) {
    try { return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8')); } catch (_) {}
  }
  return [];
};

const addLead = async (leadData) => {
  await ensureReady();
  const id = leadData.id || ('lead_' + Date.now());
  const leadObj = {
    id,
    ...leadData,
    receivedAt: new Date().toISOString()
  };

  if (usePostgres && pool) {
    try {
      await pool.query(
        'INSERT INTO leads (id, data, received_at) VALUES ($1, $2, NOW())',
        [id, JSON.stringify(leadObj)]
      );
    } catch (err) {
      console.error('DB error addLead:', err.message);
    }
  }

  // Also maintain in local file
  let leads = [];
  if (fs.existsSync(LEADS_FILE)) {
    try { leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8')); } catch (_) {}
  }
  leads.push(leadObj);
  try { fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8'); } catch (_) {}

  return leadObj;
};

// ==========================================
// 4.1 Platform Feedback Notes CRUD Operations
// ==========================================

const getNotes = async () => {
  await ensureReady();
  if (usePostgres && pool) {
    try {
      const res = await pool.query("SELECT data FROM platform_data WHERE key = 'platform_notes'");
      if (res.rows.length > 0 && res.rows[0].data) {
        return res.rows[0].data;
      }
    } catch (err) {
      console.error('DB error getNotes, fallback to file:', err.message);
    }
  }

  if (fs.existsSync(NOTES_FILE)) {
    try { return JSON.parse(fs.readFileSync(NOTES_FILE, 'utf-8')); } catch (_) {}
  }
  return [];
};

const saveNotes = async (notes, updatedBy = 'unknown') => {
  await ensureReady();
  try {
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2), 'utf-8');
  } catch (_) {}

  if (usePostgres && pool) {
    try {
      await pool.query(
        `INSERT INTO platform_data (key, data, updated_by, updated_at)
         VALUES ('platform_notes', $1, $2, NOW())
         ON CONFLICT (key) DO UPDATE
         SET data = EXCLUDED.data, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
        [JSON.stringify(notes), updatedBy]
      );
      return true;
    } catch (err) {
      console.error('DB error saveNotes:', err.message);
      throw err;
    }
  }
  return true;
};

// ==========================================
// 5. Backups & System Snapshots Operations
// ==========================================

const createBackup = async (type = 'auto', note = '') => {
  await ensureReady();
  const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
  const backupId = 'bk_' + Date.now();
  const backupFileName = `backup_${timestampStr}.json`;
  const backupFilePath = path.join(BACKUPS_DIR, backupFileName);

  const planData = await getPlanData();
  const usersData = await getUsers();
  const leadsData = await getLeads();
  const pdrData = await getPdrData();
  const notesData = await getNotes();

  const snapshot = {
    id: backupId,
    filename: backupFileName,
    timestamp: new Date().toISOString(),
    type,
    note: note || (type === 'manual' ? 'نسخة يدوية مأخوذة بواسطة المشرف' : 'نسخة احتياطية آلية مجدولة'),
    data: {
      database: planData,
      pdr: pdrData,
      users: usersData,
      leads: leadsData,
      notes: notesData
    }
  };

  // Write snapshot file locally
  fs.writeFileSync(backupFilePath, JSON.stringify(snapshot, null, 2), 'utf-8');
  const fileSize = fs.statSync(backupFilePath).size;

  if (usePostgres && pool) {
    try {
      await pool.query(
        `INSERT INTO system_backups (id, filename, timestamp, type, note, size_bytes, data, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [backupId, backupFileName, new Date(snapshot.timestamp), type, snapshot.note, fileSize, JSON.stringify(snapshot.data)]
      );
    } catch (err) {
      console.warn('Could not record backup in PostgreSQL system_backups:', err.message);
    }
  }

  // Rotation: Keep latest 30 file backups
  try {
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
      .map(f => ({ name: f, time: fs.statSync(path.join(BACKUPS_DIR, f)).mtimeMs }))
      .sort((a, b) => b.time - a.time);

    if (files.length > 30) {
      const toDelete = files.slice(30);
      toDelete.forEach(f => {
        try { fs.unlinkSync(path.join(BACKUPS_DIR, f.name)); } catch (_) {}
      });
    }
  } catch (_) {}

  return { id: backupId, filename: backupFileName, timestamp: snapshot.timestamp, size: fileSize, type, note: snapshot.note };
};

const getBackupsList = async () => {
  await ensureReady();
  const files = fs.readdirSync(BACKUPS_DIR)
    .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
    .map(f => {
      const filePath = path.join(BACKUPS_DIR, f);
      const stat = fs.statSync(filePath);
      let note = 'نسخة احتياطية';
      let type = 'auto';
      let id = 'bk_' + stat.mtimeMs;
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (content.id) id = content.id;
        if (content.note) note = content.note;
        if (content.type) type = content.type;
      } catch (_) {}
      return {
        id,
        filename: f,
        timestamp: new Date(stat.mtimeMs).toISOString(),
        size: stat.size,
        sizeKb: (stat.size / 1024).toFixed(2),
        type,
        note
      };
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return files;
};

const restoreFromSnapshot = async (filename, adminUsername = 'admin') => {
  await ensureReady();
  const safeFilename = path.basename(filename);
  const targetPath = path.join(BACKUPS_DIR, safeFilename);

  if (!fs.existsSync(targetPath)) {
    throw new Error('ملف النسخة الاحتياطية غير موجود');
  }

  const snapshot = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));

  // Safety pre-restore backup
  await createBackup('pre_restore', `نسخة أمان آلية قبل استرجاع ${safeFilename}`);

  // Restore Database (Plan)
  if (snapshot.data && snapshot.data.database) {
    await savePlanData(snapshot.data.database, `restore_by_${adminUsername}`);
  }
  // Restore PDR
  if (snapshot.data && snapshot.data.pdr) {
    await savePdrData(snapshot.data.pdr, `restore_by_${adminUsername}`);
  }
  // Restore Notes
  if (snapshot.data && snapshot.data.notes) {
    await saveNotes(snapshot.data.notes, `restore_by_${adminUsername}`);
  }
  // Restore Users
  if (snapshot.data && Array.isArray(snapshot.data.users)) {
    for (const u of snapshot.data.users) {
      await saveUser(u);
    }
  }

  return { success: true, restoredFrom: safeFilename };
};

// ==========================================
// 6. Health & Status
// ==========================================

const getStatus = async () => {
  await ensureReady();
  let dbPing = false;
  let dbLatencyMs = null;

  if (usePostgres && pool) {
    const start = Date.now();
    try {
      await pool.query('SELECT 1');
      dbPing = true;
      dbLatencyMs = Date.now() - start;
    } catch (_) {
      dbPing = false;
    }
  }

  return {
    engine: usePostgres ? 'postgresql' : 'json_files',
    postgresConnected: usePostgres && dbPing,
    postgresLatencyMs: dbLatencyMs,
    poolActive: !!pool
  };
};

module.exports = {
  ensureReady,
  getUsers,
  getUserByUsername,
  saveUser,
  deleteUser,
  syncOrphanedAssignments,
  getPlanData,
  savePlanData,
  getPdrData,
  savePdrData,
  getNotes,
  saveNotes,
  getLeads,
  addLead,
  createBackup,
  getBackupsList,
  restoreFromSnapshot,
  getStatus,
  BACKUPS_DIR,
  NOTES_FILE
};

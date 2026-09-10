/**
 * migrate-aws-to-supabase.js
 * Directly transfers all data from AWS RDS/Aurora PostgreSQL to Supabase PostgreSQL.
 */

const { Pool } = require('pg');

// AWS RDS Source Connection Configuration
const awsConfig = {
  host: process.env.AWS_PGHOST || 'ahsaseerah.cluster-c4nwyy0g6z1v.us-east-1.rds.amazonaws.com',
  port: parseInt(process.env.AWS_PGPORT || '5432', 10),
  database: process.env.AWS_PGDATABASE || 'postgres',
  user: process.env.AWS_PGUSER || 'ahsaseerah',
  password: process.env.AWS_PGPASSWORD || 'sayedaly',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000
};

// Supabase Destination Connection Configuration
const supabaseConfig = {
  host: process.env.PGHOST || 'db.htznmeemcenghbidxgxb.supabase.co',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'postgres',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'Sayedaly@1420',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000
};

async function migrateAwsToSupabase() {
  console.log('===============================================================');
  console.log('🔄 [AWS ➡️ Supabase] Starting Direct Cloud-to-Cloud Migration');
  console.log('===============================================================');
  console.log(`📡 Source (AWS RDS): ${awsConfig.host} (DB: ${awsConfig.database}, User: ${awsConfig.user})`);
  console.log(`🎯 Destination (Supabase): ${supabaseConfig.host} (DB: ${supabaseConfig.database})`);
  console.log('---------------------------------------------------------------\n');

  const awsPool = new Pool(awsConfig);
  const supabasePool = new Pool(supabaseConfig);

  let awsClient = null;
  let supabaseClient = null;

  try {
    // 1. Connect to AWS
    console.log('⏳ 1. Connecting to AWS RDS/Aurora PostgreSQL...');
    try {
      awsClient = await awsPool.connect();
      console.log('  ✅ Successfully connected to AWS RDS Database!');
    } catch (err) {
      console.error('  ❌ Failed to connect to AWS RDS:', err.message);
      if (err.message.includes('timeout') || err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED')) {
        console.error('\n⚠️ [VPC / Security Group Notice]:');
        console.error('If this connection timed out, the AWS RDS Security Group may only allow inbound traffic from Elastic Beanstalk (EC2).');
        console.error('Please ensure the AWS RDS Security Group has an Inbound Rule allowing Port 5432 from 0.0.0.0/0 (or your IP) with "Publicly Accessible: Yes".');
      }
      throw err;
    }

    // 2. Connect to Supabase
    console.log('\n⏳ 2. Connecting to Supabase PostgreSQL...');
    supabaseClient = await supabasePool.connect();
    console.log('  ✅ Successfully connected to Supabase Database!');

    // 3. Inspect Tables on AWS
    console.log('\n🔍 3. Discovering Tables in AWS Database...');
    const tablesRes = await awsClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    const availableTables = tablesRes.rows.map(r => r.table_name);
    console.log(`  -> Found ${availableTables.length} tables in AWS public schema: [${availableTables.join(', ')}]`);

    // Ensure Supabase tables exist
    console.log('\n📦 4. Ensuring schema tables exist in Supabase...');
    await supabaseClient.query(`
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

      CREATE TABLE IF NOT EXISTS platform_data (
        key VARCHAR(100) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_by VARCHAR(100),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(64) PRIMARY KEY,
        data JSONB NOT NULL,
        received_at TIMESTAMPTZ DEFAULT NOW()
      );

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
    console.log('  ✅ Target tables in Supabase verified.');

    // 5. Transfer Users
    let usersCount = 0;
    if (availableTables.includes('users')) {
      console.log('\n👥 5. Transferring [users] table from AWS...');
      const usersRes = await awsClient.query('SELECT * FROM users');
      console.log(`  -> Found ${usersRes.rows.length} users on AWS RDS.`);
      for (const row of usersRes.rows) {
        await supabaseClient.query(
          `INSERT INTO users (id, username, name, password, role, specialty, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (username) DO UPDATE
           SET name = EXCLUDED.name,
               password = EXCLUDED.password,
               role = EXCLUDED.role,
               specialty = EXCLUDED.specialty,
               updated_at = EXCLUDED.updated_at`,
          [
            row.id,
            row.username,
            row.name,
            row.password,
            row.role,
            row.specialty,
            row.created_at || new Date(),
            row.updated_at || new Date()
          ]
        );
        usersCount++;
      }
      console.log(`  ✅ Successfully migrated ${usersCount} users from AWS to Supabase.`);
    }

    // 6. Transfer Platform Data (museum_plan, pdr_data, platform_notes, etc.)
    let platformDataCount = 0;
    if (availableTables.includes('platform_data')) {
      console.log('\n🏛️ 6. Transferring [platform_data] documents from AWS...');
      const pDataRes = await awsClient.query('SELECT * FROM platform_data');
      console.log(`  -> Found ${pDataRes.rows.length} document keys on AWS RDS: [${pDataRes.rows.map(r => r.key).join(', ')}]`);
      for (const row of pDataRes.rows) {
        await supabaseClient.query(
          `INSERT INTO platform_data (key, data, updated_by, updated_at)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (key) DO UPDATE
           SET data = EXCLUDED.data,
               updated_by = EXCLUDED.updated_by,
               updated_at = EXCLUDED.updated_at`,
          [row.key, typeof row.data === 'string' ? row.data : JSON.stringify(row.data), row.updated_by, row.updated_at || new Date()]
        );
        platformDataCount++;
      }
      console.log(`  ✅ Successfully migrated ${platformDataCount} platform documents from AWS to Supabase.`);
    }

    // 7. Transfer Leads
    let leadsCount = 0;
    if (availableTables.includes('leads')) {
      console.log('\n📩 7. Transferring [leads] from AWS...');
      const leadsRes = await awsClient.query('SELECT * FROM leads');
      console.log(`  -> Found ${leadsRes.rows.length} leads on AWS RDS.`);
      for (const row of leadsRes.rows) {
        await supabaseClient.query(
          `INSERT INTO leads (id, data, received_at)
           VALUES ($1, $2, $3)
           ON CONFLICT (id) DO UPDATE
           SET data = EXCLUDED.data,
               received_at = EXCLUDED.received_at`,
          [row.id, typeof row.data === 'string' ? row.data : JSON.stringify(row.data), row.received_at || new Date()]
        );
        leadsCount++;
      }
      console.log(`  ✅ Successfully migrated ${leadsCount} leads from AWS to Supabase.`);
    }

    // 8. Transfer System Backups
    let backupsCount = 0;
    if (availableTables.includes('system_backups')) {
      console.log('\n💾 8. Transferring [system_backups] from AWS...');
      const backupsRes = await awsClient.query('SELECT * FROM system_backups');
      console.log(`  -> Found ${backupsRes.rows.length} backups on AWS RDS.`);
      for (const row of backupsRes.rows) {
        await supabaseClient.query(
          `INSERT INTO system_backups (id, filename, timestamp, type, note, size_bytes, data, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE
           SET filename = EXCLUDED.filename,
               timestamp = EXCLUDED.timestamp,
               type = EXCLUDED.type,
               note = EXCLUDED.note,
               size_bytes = EXCLUDED.size_bytes,
               data = EXCLUDED.data,
               created_at = EXCLUDED.created_at`,
          [
            row.id,
            row.filename,
            row.timestamp,
            row.type,
            row.note,
            row.size_bytes,
            typeof row.data === 'string' ? row.data : JSON.stringify(row.data),
            row.created_at || new Date()
          ]
        );
        backupsCount++;
      }
      console.log(`  ✅ Successfully migrated ${backupsCount} backups from AWS to Supabase.`);
    }

    // 9. Final Verification
    console.log('\n===============================================================');
    console.log('🎉 [MIGRATION COMPLETED] Direct AWS ➡️ Supabase Migration Report:');
    console.log('===============================================================');
    console.log(`- Users migrated from AWS: ${usersCount}`);
    console.log(`- Platform data documents migrated from AWS: ${platformDataCount}`);
    console.log(`- Leads migrated from AWS: ${leadsCount}`);
    console.log(`- System Backups migrated from AWS: ${backupsCount}`);
    console.log('===============================================================\n');

  } catch (err) {
    console.error('\n❌ Migration terminated with error:', err.message);
  } finally {
    if (awsClient) awsClient.release();
    if (supabaseClient) supabaseClient.release();
    await awsPool.end();
    await supabasePool.end();
  }
}

migrateAwsToSupabase();

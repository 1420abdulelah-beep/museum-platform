const { Pool } = require('pg');

async function deepInspectAws() {
  const masterPool = new Pool({
    host: 'ahsaseerah.cluster-c4nwyy0g6z1v.us-east-1.rds.amazonaws.com',
    port: 5432,
    database: 'postgres',
    user: 'ahsaseerah',
    password: 'sayedaly',
    ssl: { rejectUnauthorized: false }
  });

  const client = await masterPool.connect();

  console.log('=== 1. Listing All Databases on AWS Cluster ===');
  const dbsRes = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
  console.log('Databases:', dbsRes.rows.map(r => r.datname));

  for (const dbRow of dbsRes.rows) {
    const dbName = dbRow.datname;
    console.log(`\n========================================`);
    console.log(`🔍 Inspecting Database: [${dbName}]`);
    console.log(`========================================`);

    const dbPool = new Pool({
      host: 'ahsaseerah.cluster-c4nwyy0g6z1v.us-east-1.rds.amazonaws.com',
      port: 5432,
      database: dbName,
      user: 'ahsaseerah',
      password: 'sayedaly',
      ssl: { rejectUnauthorized: false }
    });

    try {
      const dbClient = await dbPool.connect();

      // List all tables
      const tablesRes = await dbClient.query(`
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
      `);
      console.log(`Tables in ${dbName}:`, tablesRes.rows.map(r => `${r.table_schema}.${r.table_name}`));

      for (const t of tablesRes.rows) {
        const countRes = await dbClient.query(`SELECT count(*) FROM "${t.table_schema}"."${t.table_name}"`);
        console.log(`  -> Table [${t.table_name}]: ${countRes.rows[0].count} rows`);

        if (t.table_name === 'users') {
          const uRes = await dbClient.query(`SELECT id, username, name, role, specialty FROM "${t.table_schema}"."${t.table_name}"`);
          console.log(`     Users in ${dbName}:`, uRes.rows);
        }

        if (t.table_name === 'platform_data') {
          const pRes = await dbClient.query(`SELECT key, updated_by, updated_at, substring(data::text, 1, 300) as snippet FROM "${t.table_schema}"."${t.table_name}"`);
          console.log(`     Platform Data keys in ${dbName}:`, pRes.rows);
        }
      }

      dbClient.release();
      await dbPool.end();
    } catch (err) {
      console.error(`Could not connect to database ${dbName}:`, err.message);
    }
  }

  client.release();
  await masterPool.end();
}

deepInspectAws();

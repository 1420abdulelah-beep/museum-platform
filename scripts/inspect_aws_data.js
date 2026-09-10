const { Pool } = require('pg');

async function inspectAwsData() {
  const awsPool = new Pool({
    host: 'ahsaseerah.cluster-c4nwyy0g6z1v.us-east-1.rds.amazonaws.com',
    port: 5432,
    database: 'postgres',
    user: 'ahsaseerah',
    password: 'sayedaly',
    ssl: { rejectUnauthorized: false }
  });

  const client = await awsPool.connect();

  console.log('=== AWS platform_data keys & structure ===');
  const rows = await client.query('SELECT key, data FROM platform_data');
  for (const row of rows.rows) {
    console.log(`\n--- Key: ${row.key} ---`);
    if (typeof row.data === 'object' && row.data !== null) {
      console.log('Object Keys:', Object.keys(row.data));
      if (row.key === 'museum_plan') {
        console.log('Plan summary:', JSON.stringify(row.data, null, 2).slice(0, 500));
      }
      if (row.key === 'pdr_data') {
        console.log('PDR summary:', JSON.stringify(row.data, null, 2).slice(0, 500));
      }
    } else {
      console.log('Type:', typeof row.data, String(row.data).slice(0, 200));
    }
  }

  client.release();
  await awsPool.end();
}

inspectAwsData();

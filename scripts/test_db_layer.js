const db = require('../db');

async function testDbLayer() {
  console.log('Testing db.js layer with Supabase...');
  await db.ensureReady();

  const status = await db.getStatus();
  console.log('DB Status:', status);

  const users = await db.getUsers();
  console.log(`Users loaded: ${users.length}`);

  const plan = await db.getPlanData();
  console.log(`Plan loaded: ${plan ? 'YES (Museum: ' + (plan.museumName || 'OK') + ')' : 'NO'}`);

  const pdr = await db.getPdrData();
  console.log(`PDR loaded: ${pdr ? 'YES (Title: ' + (pdr.projectTitle || 'OK') + ')' : 'NO'}`);

  const backups = await db.getBackupsList();
  console.log(`Backups available: ${backups.length}`);

  if (status.postgresConnected && users.length > 0 && plan && pdr) {
    console.log('\n🎉 [SUCCESS] Supabase Database & Data Layer is 100% operational and verified!');
  } else {
    console.error('\n❌ DB Layer check failed!');
  }
}

testDbLayer();

const fs = require('fs');
const path = require('path');

const backupsDir = path.join(__dirname, '..', 'data', 'backups');
const files = fs.readdirSync(backupsDir).filter(f => f.endsWith('.json'));

files.forEach(f => {
  const filePath = path.join(backupsDir, f);
  const stat = fs.statSync(filePath);
  try {
    const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const dbTitle = json.data?.database?.metadata?.titleAr || json.data?.database?.intro?.visionAr?.slice(0, 30);
    const pdrSections = json.data?.pdr?.sections?.length || 0;
    const usersCount = json.data?.users?.length || 0;
    console.log(`[${f}] Size: ${(stat.size/1024).toFixed(1)} KB | Title: ${dbTitle} | PDR Secs: ${pdrSections} | Users: ${usersCount}`);
  } catch (e) {
    console.log(`[${f}] Error: ${e.message}`);
  }
});

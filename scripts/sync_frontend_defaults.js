/**
 * sync_frontend_defaults.js
 * Updates all JS data files (detailedPlanData.js, pdrData.js, authGuard.js, teamAdmin.js)
 * with the exact real AWS live data.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const JS_DIR = path.join(__dirname, '..', 'js');

const users = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'users.json'), 'utf-8'));
const planData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'database.json'), 'utf-8'));
const pdrData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'pdr_database.json'), 'utf-8'));

// 1. Update detailedPlanData.js
const detailedPlanDataContent = `/**
 * detailedPlanData.js
 * Synchronized with AWS RDS live museum_plan data
 */
window.App = window.App || {};
window.App.DetailedPlanData = ${JSON.stringify(planData, null, 2)};
`;
fs.writeFileSync(path.join(JS_DIR, 'detailedPlanData.js'), detailedPlanDataContent, 'utf-8');
console.log('✅ Updated js/detailedPlanData.js with AWS live plan data.');

// 2. Update pdrData.js
const pdrDataContent = `/**
 * pdrData.js
 * Synchronized with AWS RDS live pdr_data
 */
window.App = window.App || {};
window.App.PdrData = ${JSON.stringify(pdrData, null, 2)};
`;
fs.writeFileSync(path.join(JS_DIR, 'pdrData.js'), pdrDataContent, 'utf-8');
console.log('✅ Updated js/pdrData.js with AWS live PDR data.');

// 3. Update authGuard.js offlineUsers
let authGuardCode = fs.readFileSync(path.join(JS_DIR, 'authGuard.js'), 'utf-8');
const sanitizedUsersForAuth = users.map(u => ({
  username: u.username,
  name: u.name,
  role: u.role,
  password: u.password
}));
authGuardCode = authGuardCode.replace(
  /this\.offlineUsers\s*=\s*\[[\s\S]*?\];/m,
  `this.offlineUsers = ${JSON.stringify(sanitizedUsersForAuth, null, 8).trim()};`
);
fs.writeFileSync(path.join(JS_DIR, 'authGuard.js'), authGuardCode, 'utf-8');
console.log('✅ Updated js/authGuard.js offline users.');

// 4. Update teamAdmin.js fallback users
let teamAdminCode = fs.readFileSync(path.join(JS_DIR, 'teamAdmin.js'), 'utf-8');
teamAdminCode = teamAdminCode.replace(
  /this\.users\s*=\s*\[[\s\S]*?\];/m,
  `this.users = ${JSON.stringify(users, null, 10).trim()};`
);
fs.writeFileSync(path.join(JS_DIR, 'teamAdmin.js'), teamAdminCode, 'utf-8');
console.log('✅ Updated js/teamAdmin.js fallback users.');

// 5. Update detailedPlanModel.js fallback users
let planModelCode = fs.readFileSync(path.join(JS_DIR, 'detailedPlanModel.js'), 'utf-8');
planModelCode = planModelCode.replace(
  /const\s+offlineUsers\s*=\s*\[[\s\S]*?\];/m,
  `const offlineUsers = ${JSON.stringify(sanitizedUsersForAuth, null, 8).trim()};`
);
fs.writeFileSync(path.join(JS_DIR, 'detailedPlanModel.js'), planModelCode, 'utf-8');
console.log('✅ Updated js/detailedPlanModel.js offline users.');

// 6. Update pdrModel.js fallback users
let pdrModelCode = fs.readFileSync(path.join(JS_DIR, 'pdrModel.js'), 'utf-8');
pdrModelCode = pdrModelCode.replace(
  /const\s+offlineUsers\s*=\s*\[[\s\S]*?\];/m,
  `const offlineUsers = ${JSON.stringify(sanitizedUsersForAuth, null, 8).trim()};`
);
fs.writeFileSync(path.join(JS_DIR, 'pdrModel.js'), pdrModelCode, 'utf-8');
console.log('✅ Updated js/pdrModel.js offline users.');

console.log('\n🎉 [COMPLETE] All frontend default and fallback files updated with real AWS data!');

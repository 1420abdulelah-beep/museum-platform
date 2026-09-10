const http = require('http');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const PORT = process.env.PORT || 8080;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  try { fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch (_) {}
}
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ico': 'image/x-icon'
};

// Active session tokens map in memory: token -> { id, username, name, role, expiresAt }
const activeTokens = new Map();

// Helper to verify Authorization header or query param and return active user session
const getAuthSession = (req) => {
  let token = '';
  const authHeader = req.headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      token = parsedUrl.searchParams.get('token') || '';
    } catch (_) {}
  }
  if (!token) return null;
  const session = activeTokens.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    activeTokens.delete(token);
    return null;
  }
  return session;
};

// Helper to generate a random session token
const generateToken = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = 'tok_';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token + '_' + Date.now();
};

// Start periodic automated backup timer (Every 24 hours)
setInterval(() => {
  db.createBackup('auto_daily', 'النسخة الاحتياطية اليومية الآلية');
}, 24 * 60 * 60 * 1000);

// Initial baseline backup & assignments sync on server startup
setTimeout(async () => {
  try {
    await db.syncOrphanedAssignments();
    const list = await db.getBackupsList();
    if (list.length === 0) {
      await db.createBackup('auto_daily', 'النسخة التأسيسية الأولى للنظام');
    }
  } catch (_) {}
}, 3000);

// Helper to send JSON responses
const sendJson = (res, statusCode, data) => {
  const jsonStr = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(jsonStr),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(jsonStr);
};

// Helper to parse JSON request body
const parseBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      // Protect against payload > 20MB
      if (body.length > 20 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) {
        return resolve({});
      }
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', err => reject(err));
  });
};

const requestHandler = async (req, res) => {
  let reqUrl = decodeURI(req.url.split('?')[0]);

  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }

  // 1. Health check endpoint for Elastic Beanstalk / ALB / Monitoring
  if (reqUrl === '/health' || reqUrl === '/healthcheck') {
    try {
      const dbStatus = await db.getStatus();
      sendJson(res, 200, {
        status: 'ok',
        uptime: process.uptime(),
        database: dbStatus,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      sendJson(res, 200, {
        status: 'degraded',
        uptime: process.uptime(),
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
    return;
  }

  // 2. Authentication: POST /api/auth/login
  if (reqUrl === '/api/auth/login' && req.method === 'POST') {
    try {
      const { username, password } = await parseBody(req);
      if (!username || !password) {
        sendJson(res, 400, { status: 'error', message: 'اسم المستخدم وكلمة المرور مطلوبة' });
        return;
      }

      const users = await db.getUsers();
      const user = users.find(u => u.username && u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password.trim());

      if (!user) {
        sendJson(res, 401, { status: 'error', message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        return;
      }

      // Generate session token (valid for 7 days)
      const token = generateToken();
      const sessionData = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role, // 'admin' | 'editor'
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
      };
      activeTokens.set(token, sessionData);

      console.log(`[AUTH] User '${user.username}' logged in with role '${user.role}'`);
      sendJson(res, 200, {
        status: 'success',
        message: 'تم تسجيل الدخول بنجاح',
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role
        }
      });
    } catch (e) {
      sendJson(res, 500, { status: 'error', message: 'خطأ أثناء تسجيل الدخول', error: e.message });
    }
    return;
  }

  // 3. Authentication: GET /api/auth/me (Check current session)
  if (reqUrl === '/api/auth/me' && req.method === 'GET') {
    const session = getAuthSession(req);
    if (!session) {
      sendJson(res, 401, { status: 'unauthorized', user: null });
      return;
    }
    sendJson(res, 200, {
      status: 'success',
      user: {
        id: session.id,
        username: session.username,
        name: session.name,
        role: session.role
      }
    });
    return;
  }

  // 3.1 Public/Authenticated Team Members Directory: GET /api/team-members
  if (reqUrl === '/api/team-members' && req.method === 'GET') {
    try {
      const users = await db.getUsers();
      const sanitizedUsers = users.map(({ password, ...u }) => ({
        id: u.id || ('usr_' + u.username),
        username: u.username,
        name: u.name || u.username,
        role: u.role || 'editor',
        specialty: u.specialty || 'عضو فريق',
        track: u.specialty || 'عضو فريق',
        avatar: u.role === 'admin' ? '👑' : '👨‍💼',
        email: `${u.username}@seraj-museum.sa`
      }));
      sendJson(res, 200, { status: 'success', users: sanitizedUsers });
    } catch (e) {
      sendJson(res, 500, { status: 'error', message: 'فشل استرجاع أعضاء الفريق', error: e.message });
    }
    return;
  }

  // 4. User Management: GET /api/users (Admin-only)
  if (reqUrl === '/api/users' && req.method === 'GET') {
    const session = getAuthSession(req);
    if (!session || session.role !== 'admin') {
      sendJson(res, 403, { status: 'error', message: 'غير مصرح: هذه الصلاحية خاصة بمدير النظام (Admin) فقط' });
      return;
    }
    try {
      const users = await db.getUsers();
      const sanitizedUsers = users.map(({ password, ...u }) => u);
      sendJson(res, 200, { status: 'success', users: sanitizedUsers });
    } catch (e) {
      sendJson(res, 500, { status: 'error', message: 'فشل استرجاع قائمة المستخدمين', error: e.message });
    }
    return;
  }

  // 5. User Management: POST /api/users (Admin-only: Create/Update user)
  if (reqUrl === '/api/users' && req.method === 'POST') {
    const session = getAuthSession(req);
    if (!session || session.role !== 'admin') {
      sendJson(res, 403, { status: 'error', message: 'غير مصرح: إضافة وتعديل المستخدمين متاح للمدير (Admin) فقط' });
      return;
    }

    try {
      const { username, password, name, role, specialty } = await parseBody(req);
      if (!username || !name || !role) {
        sendJson(res, 400, { status: 'error', message: 'جميع حقول المستخدم مطلوبة' });
        return;
      }
      if (!['admin', 'editor', 'viewer'].includes(role)) {
        sendJson(res, 400, { status: 'error', message: 'الصلاحية يجب أن تكون إما admin أو editor أو viewer' });
        return;
      }

      await db.saveUser({
        username: username.trim(),
        name: name.trim(),
        role,
        specialty: specialty ? specialty.trim() : 'عضو فريق',
        password: password ? password.trim() : null
      });

      console.log(`[USERS] User '${username}' (${role}) saved by Admin '${session.username}'`);
      sendJson(res, 200, { status: 'success', message: 'تم حفظ بيانات وصلاحيات المستخدم بنجاح' });
    } catch (e) {
      sendJson(res, 500, { status: 'error', message: 'فشل حفظ المستخدم', error: e.message });
    }
    return;
  }

  // 6. User Management: DELETE /api/users (Admin-only: Delete user)
  if (reqUrl.startsWith('/api/users') && req.method === 'DELETE') {
    const session = getAuthSession(req);
    if (!session || session.role !== 'admin') {
      sendJson(res, 403, { status: 'error', message: 'غير مصرح: حذف المستخدمين متاح للمدير (Admin) فقط' });
      return;
    }

    try {
      const payload = await parseBody(req);
      const parsedUrl = new URL(req.url, 'http://localhost');
      const usernameToDelete = payload.username || parsedUrl.searchParams.get('username');

      if (!usernameToDelete) {
        sendJson(res, 400, { status: 'error', message: 'اسم المستخدم المطلوب حذفه مفقود' });
        return;
      }

      if (usernameToDelete.toLowerCase() === session.username.toLowerCase()) {
        sendJson(res, 400, { status: 'error', message: 'لا يمكنك حذف حسابك الحالي أثناء تسجيل الدخول به' });
        return;
      }

      const users = await db.getUsers();
      const adminCount = users.filter(u => u.role === 'admin').length;
      const targetUser = users.find(u => u.username.toLowerCase() === usernameToDelete.toLowerCase());

      if (targetUser && targetUser.role === 'admin' && adminCount <= 1) {
        sendJson(res, 400, { status: 'error', message: 'لا يمكن حذف آخر مدير نظام في المنصة' });
        return;
      }

      await db.deleteUser(usernameToDelete, payload.reassignTo || null);
      console.log(`[USERS] User '${usernameToDelete}' deleted and assignments cleaned/reassigned by Admin '${session.username}'`);
      sendJson(res, 200, { status: 'success', message: 'تم حذف المستخدم وتحديث مصفوفة إسناد المهام بنجاح' });
    } catch (e) {
      sendJson(res, 500, { status: 'error', message: 'فشل حذف المستخدم', error: e.message });
    }
    return;
  }

  // 6.1 User Management: POST /api/users/sync-assignments (Admin-only: Clean and sync orphaned tasks)
  if (reqUrl === '/api/users/sync-assignments' && req.method === 'POST') {
    const session = getAuthSession(req);
    if (!session || session.role !== 'admin') {
      sendJson(res, 403, { status: 'error', message: 'غير مصرح: صيانة إسناد المهام متاحة لمدير النظام (Admin) فقط' });
      return;
    }

    try {
      const syncResult = await db.syncOrphanedAssignments();
      console.log(`[SYNC] Orphaned assignments cleaned by Admin '${session.username}'`);
      sendJson(res, 200, {
        status: 'success',
        message: 'تم فحص وتنظيف مصفوفة إسناد المهام وإزالة أسماء الأعضاء المحذوفين بنجاح',
        result: syncResult
      });
    } catch (e) {
      sendJson(res, 500, { status: 'error', message: 'فشل مزامنة إسناد المهام', error: e.message });
    }
    return;
  }

  
  // 6.5 REST API: POST /api/upload (Upload image/document file and return URL)
  if (reqUrl === '/api/upload' && req.method === 'POST') {
    const session = getAuthSession(req);
    if (session && session.role === 'viewer') {
      sendJson(res, 403, { status: 'error', message: 'غير مصرح: حسابك بصلاحية استعراض فقط ولا يمكنك رفع ملفات' });
      return;
    }

    try {
      const payload = await parseBody(req);
      const dataUrl = payload.dataUrl || payload.image || payload.file || "";
      let originalName = payload.filename || payload.name || ("file_" + Date.now() + ".png");
      
      // Clean filename
      const ext = path.extname(originalName) || ".png";
      const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-؀-ۿ]/g, '_');
      const uniqueFilename = `${base}_${Date.now()}${ext}`;
      const targetFilePath = path.join(UPLOADS_DIR, uniqueFilename);

      if (dataUrl.startsWith("data:")) {
        const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const buffer = Buffer.from(matches[2], 'base64');
          fs.writeFileSync(targetFilePath, buffer);
          console.log(`[UPLOAD] Saved file: ${uniqueFilename} (${(buffer.length / 1024).toFixed(1)} KB)`);
          sendJson(res, 200, {
            status: 'success',
            message: 'تم رفع الملف بنجاح',
            url: '/uploads/' + uniqueFilename,
            filename: uniqueFilename,
            sizeKb: (buffer.length / 1024).toFixed(1)
          });
          return;
        } else if (dataUrl.includes("<svg") || dataUrl.startsWith("data:image/svg+xml")) {
          // SVG string
          const svgContent = decodeURIComponent(dataUrl.replace(/^data:image\/svg\+xml;utf8,/, ''));
          const svgFilename = `${base}_${Date.now()}.svg`;
          fs.writeFileSync(path.join(UPLOADS_DIR, svgFilename), svgContent, 'utf-8');
          sendJson(res, 200, {
            status: 'success',
            message: 'تم حفظ ملف SVG بنجاح',
            url: '/uploads/' + svgFilename,
            filename: svgFilename
          });
          return;
        }
      }

      sendJson(res, 400, { status: 'error', message: 'صيغة بيانات الملف غير صحيحة' });
    } catch (e) {
      console.error('Error during file upload:', e);
      sendJson(res, 500, { status: 'error', message: 'فشل حفظ الملف على السيرفر', error: e.message });
    }
    return;
  }

  // 7. REST API: GET /api/plan (Public: anyone can view)
  if (reqUrl === '/api/plan' && req.method === 'GET') {
    try {
      const data = await db.getPlanData();
      sendJson(res, 200, { status: 'success', data });
    } catch (e) {
      console.error('Error reading plan data:', e);
      sendJson(res, 500, { status: 'error', message: 'Failed to read database', error: e.message });
    }
    return;
  }

  // 8. REST API: POST /api/plan (Save & sync museum plan)
  if (reqUrl === '/api/plan' && req.method === 'POST') {
    const session = getAuthSession(req);
    if (session && session.role === 'viewer') {
      sendJson(res, 403, { status: 'error', message: 'غير مصرح: حسابك بصلاحية استعراض فقط ولا يمكنك تعديل البيانات' });
      return;
    }

    try {
      const payload = await parseBody(req);
      if (!payload || typeof payload !== 'object') {
        sendJson(res, 400, { status: 'error', message: 'بيانات غير صحيحة' });
        return;
      }

      const username = session ? session.username : 'team_member';
      const role = session ? session.role : 'collaborator';
      await db.savePlanData(payload, username);
      console.log(`[DB] Museum plan updated by ${role} '${username}' at ${new Date().toISOString()}`);
      sendJson(res, 200, {
        status: 'success',
        message: 'تم حفظ التعديلات في قاعدة البيانات بنجاح',
        savedBy: username,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error saving plan data:', e);
      sendJson(res, 500, { status: 'error', message: 'Failed to save to database', error: e.message });
    }
    return;
  }

  
  // 8.0 REST API: GET /api/notes (Public / Synced: get all platform feedback notes)
  if (reqUrl === '/api/notes' && req.method === 'GET') {
    try {
      const notes = await db.getNotes();
      sendJson(res, 200, { status: 'success', notes });
    } catch (e) {
      console.error('Error reading platform notes:', e);
      sendJson(res, 500, { status: 'error', message: 'Failed to read notes', error: e.message });
    }
    return;
  }

  // 8.01 REST API: POST /api/notes (Save & Update platform feedback notes)
  if (reqUrl === '/api/notes' && req.method === 'POST') {
    const session = getAuthSession(req);
    if (session && session.role === 'viewer') {
      sendJson(res, 403, { status: 'error', message: 'غير مصرح: حسابك بصلاحية استعراض فقط ولا يمكنك تعديل أو إضافة الملاحظات' });
      return;
    }

    try {
      const payload = await parseBody(req);
      const notesToSave = Array.isArray(payload) ? payload : (payload.notes || []);
      const actor = session ? `${session.role} '${session.username}'` : 'collaborator (auto-sync)';
      await db.saveNotes(notesToSave, session ? session.username : 'collaborator');
      console.log(`[NOTES] Platform notes updated (${notesToSave.length} notes) by ${actor}`);
      sendJson(res, 200, { status: 'success', message: 'تم حفظ ملاحظات المنصة بنجاح', count: notesToSave.length });
    } catch (e) {
      console.error('Error saving platform notes:', e);
      sendJson(res, 500, { status: 'error', message: 'Failed to save notes', error: e.message });
    }
    return;
  }

  // 8.1 REST API: GET /api/pdr (Public: anyone can view PDR report)
  if (reqUrl === '/api/pdr' && req.method === 'GET') {
    try {
      const data = await db.getPdrData();
      sendJson(res, 200, { status: 'success', data });
    } catch (e) {
      console.error('Error reading PDR database:', e);
      sendJson(res, 500, { status: 'error', message: 'Failed to read PDR database', error: e.message });
    }
    return;
  }

  // 8.2 REST API: POST /api/pdr (Protected / Synced: save PDR project deliverables & assignments)
  if (reqUrl === '/api/pdr' && req.method === 'POST') {
    const session = getAuthSession(req);
    if (session && session.role === 'viewer') {
      sendJson(res, 403, { status: 'error', message: 'غير مصرح: حسابك بصلاحية استعراض فقط ولا يمكنك تعديل وثيقة المشروع' });
      return;
    }

    try {
      const payload = await parseBody(req);
      if (!payload || typeof payload !== 'object') {
        sendJson(res, 400, { status: 'error', message: 'بيانات غير صحيحة' });
        return;
      }

      const actor = session ? `${session.role} '${session.username}'` : 'collaborator (auto-sync)';
      await db.savePdrData(payload, session ? session.username : 'collaborator');
      console.log(`[PDR_DB] PDR state updated by ${actor} at ${new Date().toISOString()}`);
      sendJson(res, 200, {
        status: 'success',
        message: 'تم حفظ وثيقة المشروع PDR في قاعدة البيانات بنجاح',
        savedBy: session ? session.username : 'Team Member',
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Error saving PDR database:', e);
      sendJson(res, 500, { status: 'error', message: 'Failed to save PDR database', error: e.message });
    }
    return;
  }

  // 8.3 REST API: GET /api/backups (Admin-only: List all backup snapshots)
  if (reqUrl === '/api/backups' && req.method === 'GET') {
    const session = getAuthSession(req);
    if (!session || session.role !== 'admin') {
      sendJson(res, 403, { status: 'error', message: 'غير مصرح: استعراض النسخ الاحتياطية متاح لمدير النظام (Admin) فقط' });
      return;
    }

    try {
      const backups = await db.getBackupsList();
      sendJson(res, 200, { status: 'success', backups });
    } catch (e) {
      sendJson(res, 500, { status: 'error', message: 'فشل استعراض النسخ الاحتياطية', error: e.message });
    }
    return;
  }

  // 8.4 REST API: POST /api/backups/create (Admin-only: Create manual snapshot)
  if (reqUrl === '/api/backups/create' && req.method === 'POST') {
    const session = getAuthSession(req);
    if (!session || session.role !== 'admin') {
      sendJson(res, 403, { status: 'error', message: 'غير مصرح: أخذ النسخ الاحتياطية متاح لمدير النظام فقط' });
      return;
    }

    try {
      const payload = await parseBody(req);
      const snapshot = await db.createBackup('manual', payload.note || `نسخة يدوية مأخوذة بواسطة ${session.name || session.username}`);
      if (!snapshot) throw new Error('تعذر إنشاء لقطة النسخة الاحتياطية');
      sendJson(res, 200, {
        status: 'success',
        message: 'تم أخذ النسخة الاحتياطية بنجاح وحفظها في المجلد الآمن وقاعدة البيانات',
        backup: snapshot
      });
    } catch (e) {
      sendJson(res, 500, { status: 'error', message: 'فشل إنشاء النسخة الاحتياطية', error: e.message });
    }
    return;
  }

  // 8.41 REST API: GET /api/database/backup or /api/backup (Direct Full Database Snapshot Download)
  if ((reqUrl === '/api/database/backup' || reqUrl === '/api/backup' || reqUrl === '/api/database/export') && req.method === 'GET') {
    try {
      const planData = await db.getPlanData();
      const usersData = await db.getUsers();
      const leadsData = await db.getLeads();
      const pdrData = await db.getPdrData();
      const notesData = await db.getNotes();

      const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
      const masterSnapshot = {
        project: "سراج الأحساء — متحف السيرة النبوية وتاريخ الأحساء",
        slogan: "تاريخ يُروى.. وحاضر يُعاش",
        exportedAt: new Date().toISOString(),
        type: "master_full_snapshot",
        data: {
          database: planData,
          pdr: pdrData,
          users: (usersData || []).map(({ password, ...u }) => u),
          leads: leadsData,
          notes: notesData
        }
      };

      const jsonStr = JSON.stringify(masterSnapshot, null, 2);
      const downloadFilename = `seraj_alahsa_master_backup_${timestampStr}.json`;

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(jsonStr),
        'Content-Disposition': `attachment; filename="${downloadFilename}"`,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(jsonStr);
    } catch (e) {
      sendJson(res, 500, { status: 'error', message: 'فشل تصدير النسخة الاحتياطية الكاملة', error: e.message });
    }
    return;
  }

  // 8.5 REST API: GET /api/backups/download (Download snapshot file)
  if (reqUrl.startsWith('/api/backups/download') && req.method === 'GET') {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      const backupFilename = parsedUrl.searchParams.get('file') || parsedUrl.searchParams.get('id');

      if (!backupFilename) {
        sendJson(res, 400, { status: 'error', message: 'اسم ملف النسخة الاحتياطية مطلوب' });
        return;
      }

      // Sanitize filename to prevent path traversal
      const safeFilename = path.basename(backupFilename.endsWith('.json') ? backupFilename : `${backupFilename}.json`);
      const targetPath = path.join(db.BACKUPS_DIR, safeFilename);

      if (!fs.existsSync(targetPath)) {
        sendJson(res, 404, { status: 'error', message: 'ملف النسخة الاحتياطية غير موجود' });
        return;
      }

      const fileContent = fs.readFileSync(targetPath);
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': fileContent.length,
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Access-Control-Allow-Origin': '*'
      });
      res.end(fileContent);
    } catch (e) {
      sendJson(res, 500, { status: 'error', message: 'فشل تحميل النسخة الاحتياطية', error: e.message });
    }
    return;
  }

  // 8.6 REST API: POST /api/backups/restore (Admin-only: Restore data from snapshot)
  if (reqUrl === '/api/backups/restore' && req.method === 'POST') {
    const session = getAuthSession(req);
    if (!session || session.role !== 'admin') {
      sendJson(res, 403, { status: 'error', message: 'غير مصرح: استرجاع النسخ الاحتياطية متاح لمدير النظام فقط' });
      return;
    }

    try {
      const { filename } = await parseBody(req);
      if (!filename) {
        sendJson(res, 400, { status: 'error', message: 'اسم ملف النسخة المطلوب استرجاعها مفقود' });
        return;
      }

      const result = await db.restoreFromSnapshot(filename, session.username);
      console.log(`♻️ [BACKUP] System successfully restored from ${filename} by Admin '${session.username}'`);
      sendJson(res, 200, {
        status: 'success',
        message: 'تم استرجاع النظام وقاعدة البيانات بنجاح من النسخة الاحتياطية',
        restoredFrom: result.restoredFrom
      });
    } catch (e) {
      sendJson(res, 500, { status: 'error', message: 'فشل استرجاع النسخة الاحتياطية', error: e.message });
    }
    return;
  }

  // 9. REST API: POST /api/leads (Save contact / export inquiries)
  if (reqUrl === '/api/leads' && req.method === 'POST') {
    try {
      const lead = await parseBody(req);
      const savedLead = await db.addLead(lead);
      sendJson(res, 200, { status: 'success', message: 'Lead recorded successfully', lead: savedLead });
    } catch (e) {
      sendJson(res, 500, { status: 'error', message: 'Failed to save lead', error: e.message });
    }
    return;
  }

  // 10. REST API: GET /api/leads (Admin-only: Retrieve leads)
  if (reqUrl === '/api/leads' && req.method === 'GET') {
    const session = getAuthSession(req);
    if (!session || session.role !== 'admin') {
      sendJson(res, 403, { status: 'error', message: 'غير مصرح: استعراض السجلات متاح لمدير النظام فقط' });
      return;
    }
    try {
      const leads = await db.getLeads();
      sendJson(res, 200, { status: 'success', leads });
    } catch (e) {
      sendJson(res, 500, { status: 'error', message: 'Failed to read leads', error: e.message });
    }
    return;
  }

  // 11. Static Files Serving
  if (reqUrl === '' || reqUrl === '/') reqUrl = '/index.html';

  const cleanReq = reqUrl.split('?')[0].replace(/^\/+/, '');
  const candidatePaths = [
    path.join(__dirname, cleanReq),
    path.join(process.cwd(), cleanReq),
    path.join(__dirname, '..', cleanReq)
  ];

  let filePath = candidatePaths.find(p => {
    try { return fs.existsSync(p) && fs.statSync(p).isFile(); } catch (_) { return false; }
  });
  if (!filePath && !path.extname(cleanReq)) {
    filePath = candidatePaths.map(p => p + '.html').find(p => {
      try { return fs.existsSync(p) && fs.statSync(p).isFile(); } catch (_) { return false; }
    });
  }
  if (!filePath) {
    filePath = candidatePaths[0];
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const range = req.headers.range;
    if (range && (ext === '.mp4' || ext === '.webm')) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stats.size,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
};

// Start standalone HTTP server only when run directly (e.g. node server.js / Local / Docker)
let server = null;
if (require.main === module) {
  server = http.createServer(requestHandler);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://localhost:${PORT}/ (Port: ${PORT})`);
  });

  const shutdown = () => {
    console.log('Received kill signal, shutting down gracefully...');
    if (server) {
      server.close(() => {
        console.log('Closed remaining connections.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = requestHandler;

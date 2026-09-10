-- ==============================================================================
-- 🏛️ Supabase PostgreSQL Schema & Setup Script
-- Museum Interactive Platform (منصة متحف السيرة التفاعلي)
-- Project: htznmeemcenghbidxgxb (https://htznmeemcenghbidxgxb.supabase.co)
-- ==============================================================================

-- 1. جداول المستخدمين والصلاحيات (Users & Roles Table)
CREATE TABLE IF NOT EXISTS public.users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'editor',
  specialty VARCHAR(255) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول بيانات المنصة والمخططات والمستندات (Platform JSON Data: Museum Plan, PDR, Notes)
CREATE TABLE IF NOT EXISTS public.platform_data (
  key VARCHAR(100) PRIMARY KEY,
  data JSONB NOT NULL,
  updated_by VARCHAR(100),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول استفسارات الزوار وطلبات التواصل (Leads & Inquiries)
CREATE TABLE IF NOT EXISTS public.leads (
  id VARCHAR(64) PRIMARY KEY,
  data JSONB NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول النسخ الاحتياطية وسجلات الاستعادة (System Backups & Snapshots)
CREATE TABLE IF NOT EXISTS public.system_backups (
  id VARCHAR(64) PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  type VARCHAR(50) NOT NULL,
  note TEXT,
  size_bytes BIGINT,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- فهارس تحسين سرعة البحث (Performance Indexes)
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_platform_data_key ON public.platform_data(key);
CREATE INDEX IF NOT EXISTS idx_leads_received_at ON public.leads(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_backups_timestamp ON public.system_backups(timestamp DESC);

-- ==============================================================================
-- تمكين سياسات الحماية على مستوى الصفوف (Row Level Security - RLS)
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_backups ENABLE ROW LEVEL SECURITY;

-- سياسات الوصول للسيرفر (Service Role / Postgres Direct Access)
CREATE POLICY "Allow all access to service role for users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all access to service role for platform_data" ON public.platform_data FOR ALL USING (true);
CREATE POLICY "Allow all access to service role for leads" ON public.leads FOR ALL USING (true);
CREATE POLICY "Allow all access to service role for system_backups" ON public.system_backups FOR ALL USING (true);

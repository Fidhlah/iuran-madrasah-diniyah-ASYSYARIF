-- =====================
-- TABEL SANTRI
-- =====================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  class VARCHAR(20) NOT NULL,
  year_enrolled INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'alumni')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk pencarian dan filter
CREATE INDEX idx_students_name ON students(name);
CREATE INDEX idx_students_class ON students(class);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_year ON students(year_enrolled);

-- =====================
-- TABEL PEMBAYARAN
-- =====================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Satu santri hanya bisa punya 1 pembayaran per bulan per tahun
  UNIQUE(student_id, month, year)
);

-- Index untuk query pembayaran
CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_period ON payments(year, month);
CREATE INDEX idx_payments_status ON payments(is_paid);

-- =====================
-- TABEL PENGATURAN
-- =====================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES 
  ('monthly_fee', '50000', 'Nominal iuran bulanan'),
  ('school_name', 'Madrasah Asy Syarif', 'Nama madrasah'),
  ('academic_year', '2024/2025', 'Tahun ajaran aktif');

-- =====================
-- TABEL ACTIVITY LOGS
-- =====================
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Siapa yang melakukan aksi (untuk nanti jika ada auth)
  user_id UUID,
  user_name VARCHAR(255) DEFAULT 'System',
  
  -- Aksi apa yang dilakukan
  action VARCHAR(50) NOT NULL CHECK (action IN (
    'CREATE', 'UPDATE', 'DELETE', 
    'PAYMENT_MARK_PAID', 'PAYMENT_MARK_UNPAID',
    'SETTING_UPDATE', 'EXPORT_DATA', 'LOGIN', 'LOGOUT'
  )),
  
  -- Entity yang terkena aksi
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN (
    'STUDENT', 'PAYMENT', 'SETTING', 'AUTH'
  )),
  entity_id UUID,
  
  -- Detail perubahan
  description TEXT NOT NULL,
  old_data JSONB,        -- Data sebelum diubah
  new_data JSONB,        -- Data setelah diubah
  
  -- Metadata
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk query logs
CREATE INDEX idx_logs_action ON activity_logs(action);
CREATE INDEX idx_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_logs_user ON activity_logs(user_id);
CREATE INDEX idx_logs_date ON activity_logs(created_at DESC);

-- Index untuk pencarian di description
CREATE INDEX idx_logs_description ON activity_logs USING gin(to_tsvector('indonesian', description));

-- Ubah constraint status
ALTER TABLE students
  DROP CONSTRAINT students_status_check,
  ADD CONSTRAINT students_status_check CHECK (status IN ('active', 'nonactive'));

-- (Opsional) Update data lama
UPDATE students SET status = 'nonactive' WHERE status = 'alumni';
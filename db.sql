-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  user_name character varying DEFAULT 'System'::character varying,
  action character varying NOT NULL CHECK (action::text = ANY (ARRAY['CREATE'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying, 'PAYMENT_MARK_PAID'::character varying, 'PAYMENT_MARK_UNPAID'::character varying, 'SETTING_UPDATE'::character varying, 'EXPORT_DATA'::character varying, 'LOGIN'::character varying, 'LOGOUT'::character varying]::text[])),
  entity_type character varying NOT NULL CHECK (entity_type::text = ANY (ARRAY['STUDENT'::character varying, 'PAYMENT'::character varying, 'SETTING'::character varying, 'AUTH'::character varying]::text[])),
  entity_id uuid,
  description text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  ip_address character varying,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL CHECK (year >= 2020 AND year <= 2100),
  amount numeric NOT NULL DEFAULT 0,
  is_paid boolean NOT NULL DEFAULT false,
  paid_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role text NOT NULL DEFAULT 'view'::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key character varying NOT NULL UNIQUE,
  value text NOT NULL,
  description character varying,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  class character varying NOT NULL,
  year_enrolled integer NOT NULL,
  status character varying NOT NULL DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'nonactive'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  has_tabungan boolean NOT NULL DEFAULT false,
  CONSTRAINT students_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tabungan (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL UNIQUE,
  saldo numeric NOT NULL DEFAULT 0,
  jumlah_transaksi integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tabungan_pkey PRIMARY KEY (id),
  CONSTRAINT tabungan_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.tabungan_transaksi (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  tanggal timestamp with time zone NOT NULL DEFAULT now(),
  jenis character varying NOT NULL CHECK (jenis::text = ANY (ARRAY['setor'::character varying, 'tarik'::character varying]::text[])),
  nominal numeric NOT NULL,
  keterangan text,
  saldo_setelah numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tabungan_transaksi_pkey PRIMARY KEY (id),
  CONSTRAINT tabungan_transaksi_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
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
CREATE TABLE public.finances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date timestamp with time zone NOT NULL,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['income'::character varying::text, 'expense'::character varying::text])),
  amount numeric NOT NULL,
  description text,
  payment_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT finances_pkey PRIMARY KEY (id),
  CONSTRAINT finances_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id)
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


-- POLICY: Allow read for view and edit
CREATE POLICY "Allow read for view and edit" ON public.students AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['view'::text, 'edit'::text]))))));

-- POLICY: Allow write for edit
CREATE POLICY "Allow write for edit" ON public.students AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'edit'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'edit'::text)))));

-- POLICY: Enable realtime for all users
CREATE POLICY "Enable realtime for all users" ON public.students AS PERMISSIVE FOR SELECT TO public USING (true);

-- POLICY: Allow read for view and edit
CREATE POLICY "Allow read for view and edit" ON public.payments AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['view'::text, 'edit'::text]))))));

-- POLICY: Allow write for edit
CREATE POLICY "Allow write for edit" ON public.payments AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'edit'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'edit'::text)))));

-- POLICY: Enable select for all users
CREATE POLICY "Enable select for all users" ON public.payments AS PERMISSIVE FOR SELECT TO public USING (true);

-- POLICY: Allow read for view and edit
CREATE POLICY "Allow read for view and edit" ON public.settings AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['view'::text, 'edit'::text]))))));

-- POLICY: Allow write for edit
CREATE POLICY "Allow write for edit" ON public.settings AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'edit'::text))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'edit'::text)))));

-- POLICY: Enable select for all users
CREATE POLICY "Enable select for all users" ON public.settings AS PERMISSIVE FOR SELECT TO public USING (true);

-- POLICY: Allow all for authenticated users
CREATE POLICY "Allow all for authenticated users" ON public.finances AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- POLICY: Enable realtime for all users
CREATE POLICY "Enable realtime for all users" ON public.tabungan AS PERMISSIVE FOR SELECT TO public USING (true);

-- POLICY: Enable realtime for all users
CREATE POLICY "Enable realtime for all users" ON public.tabungan_transaksi AS PERMISSIVE FOR SELECT TO public USING (true);

-- FUNCTION: set_has_tabungan_true
CREATE OR REPLACE FUNCTION public.set_has_tabungan_true()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE public.students
  SET has_tabungan = true
  WHERE id = NEW.student_id;
  RETURN NEW;
END;
$function$;

-- FUNCTION: set_has_tabungan_false
CREATE OR REPLACE FUNCTION public.set_has_tabungan_false()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE public.students
  SET has_tabungan = false
  WHERE id = OLD.student_id;
  RETURN OLD;
END;
$function$;

-- FUNCTION: sync_payment_to_finances
CREATE OR REPLACE FUNCTION public.sync_payment_to_finances()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  student_name TEXT;
  month_name TEXT;
  month_names TEXT[] := ARRAY['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
BEGIN
  -- Get student name
  SELECT name INTO student_name FROM public.students WHERE id = NEW.student_id;
  
  -- Get month name
  month_name := month_names[NEW.month];

  -- When payment becomes PAID (INSERT or UPDATE to is_paid = true)
  IF NEW.is_paid = true AND (OLD IS NULL OR OLD.is_paid = false) THEN
    INSERT INTO public.finances (date, type, amount, description, payment_id)
    VALUES (
      COALESCE(NEW.paid_at, NOW()),
      'income',
      NEW.amount,
      student_name || ' membayar iuran bulan ' || month_name || ' ' || NEW.year,
      NEW.id
    );
  END IF;
  
  -- When payment becomes UNPAID (is_paid changes to false)
  IF NEW.is_paid = false AND OLD IS NOT NULL AND OLD.is_paid = true THEN
    DELETE FROM public.finances WHERE payment_id = OLD.id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- FUNCTION: insert_tabungan_on_has_tabungan_true
CREATE OR REPLACE FUNCTION public.insert_tabungan_on_has_tabungan_true()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.has_tabungan = true AND (SELECT COUNT(*) FROM tabungan WHERE student_id = NEW.id) = 0 THEN
    INSERT INTO tabungan (student_id, saldo, jumlah_transaksi, updated_at)
    VALUES (NEW.id, 0, 0, NOW());
  END IF;
  RETURN NEW;
END;
$function$;


-- TRIGGER: trg_set_has_tabungan_true ON tabungan
CREATE TRIGGER trg_set_has_tabungan_true AFTER INSERT ON tabungan FOR EACH ROW EXECUTE FUNCTION set_has_tabungan_true();

-- TRIGGER: trg_set_has_tabungan_false ON tabungan
CREATE TRIGGER trg_set_has_tabungan_false AFTER DELETE ON tabungan FOR EACH ROW EXECUTE FUNCTION set_has_tabungan_false();

-- TRIGGER: trg_insert_tabungan_on_has_tabungan_true ON students
CREATE TRIGGER trg_insert_tabungan_on_has_tabungan_true AFTER UPDATE ON students FOR EACH ROW EXECUTE FUNCTION insert_tabungan_on_has_tabungan_true();

-- TRIGGER: payment_finance_sync ON payments
CREATE TRIGGER payment_finance_sync AFTER INSERT ON payments FOR EACH ROW EXECUTE FUNCTION sync_payment_to_finances();

-- TRIGGER: payment_finance_sync ON payments
CREATE TRIGGER payment_finance_sync AFTER UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION sync_payment_to_finances();

-- REALTIME: students
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;

-- REALTIME: payments
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;

-- REALTIME: settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;

-- REALTIME: tabungan
ALTER PUBLICATION supabase_realtime ADD TABLE public.tabungan;

-- REALTIME: tabungan_transaksi
ALTER PUBLICATION supabase_realtime ADD TABLE public.tabungan_transaksi;

-- REALTIME: finances
ALTER PUBLICATION supabase_realtime ADD TABLE public.finances;
-- Sync existing paid payments to finances table
-- Run this ONCE to backfill historical data

INSERT INTO public.finances (date, type, amount, description, payment_id)
SELECT 
  COALESCE(p.paid_at, p.created_at) as date,
  'income' as type,
  p.amount,
  s.name || ' membayar iuran bulan ' || 
    CASE p.month
      WHEN 1 THEN 'Januari'
      WHEN 2 THEN 'Februari'
      WHEN 3 THEN 'Maret'
      WHEN 4 THEN 'April'
      WHEN 5 THEN 'Mei'
      WHEN 6 THEN 'Juni'
      WHEN 7 THEN 'Juli'
      WHEN 8 THEN 'Agustus'
      WHEN 9 THEN 'September'
      WHEN 10 THEN 'Oktober'
      WHEN 11 THEN 'November'
      WHEN 12 THEN 'Desember'
    END || ' ' || p.year as description,
  p.id as payment_id
FROM public.payments p
JOIN public.students s ON p.student_id = s.id
WHERE p.is_paid = true
  AND NOT EXISTS (
    SELECT 1 FROM public.finances f WHERE f.payment_id = p.id
  );
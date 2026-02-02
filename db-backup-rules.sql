SELECT string_agg(sql_statement, E'\n\n') AS full_backup FROM (
  -- ========== POLICIES ==========
  SELECT 
    '-- POLICY: ' || policyname || E'\n' ||
    'CREATE POLICY "' || policyname || '" ON ' || schemaname || '.' || tablename || 
    ' AS ' || permissive || ' FOR ' || cmd || ' TO ' || array_to_string(roles, ', ') ||
    COALESCE(' USING (' || qual || ')', '') ||
    COALESCE(' WITH CHECK (' || with_check || ')', '') || ';' AS sql_statement,
    1 AS sort_order
  FROM pg_policies WHERE schemaname = 'public'
  
  UNION ALL
  
  -- ========== TRIGGER FUNCTIONS ==========
  SELECT 
    '-- FUNCTION: ' || p.proname || E'\n' ||
    'CREATE OR REPLACE FUNCTION ' || p.proname || '() RETURNS trigger LANGUAGE plpgsql AS $$' || E'\n' ||
    pg_get_functiondef(p.oid) || E'\n$$;',
    2 AS sort_order
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.prorettype = 'trigger'::regtype
  
  UNION ALL
  
  -- ========== TRIGGERS ==========
  SELECT 
    '-- TRIGGER: ' || trigger_name || ' ON ' || event_object_table || E'\n' ||
    'CREATE TRIGGER ' || trigger_name || ' ' || 
    action_timing || ' ' || event_manipulation || 
    ' ON ' || event_object_table || 
    ' FOR EACH ROW ' || action_statement || ';',
    3 AS sort_order
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
  
  UNION ALL
  
  -- ========== REALTIME PUBLICATIONS ==========
  SELECT 
    '-- REALTIME: ' || tablename || E'\n' ||
    'ALTER PUBLICATION supabase_realtime ADD TABLE ' || schemaname || '.' || tablename || ';',
    4 AS sort_order
  FROM pg_publication_tables 
  WHERE pubname = 'supabase_realtime'
  
) AS combined
ORDER BY sort_order;
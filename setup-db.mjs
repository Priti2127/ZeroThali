// This script creates all required database objects using the Supabase service role
// It uses the REST API step by step to bootstrap the schema
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://phwivinxfxugyknclrob.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBod2l2aW54Znh1Z3lrbmNscm9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzUxNDQzNSwiZXhwIjoyMTA5MDkwNDM1fQ.i0BybXROWbdOMH4uGELBc237ttI0tokDQiqNIBEPKWQ";

// Use service role to bypass RLS
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
});

// Step 1: Try calling the pgsql endpoint directly to run DDL
async function runSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql_query: sql })
  });
  const text = await response.text();
  return { status: response.status, body: text };
}

// First, create the exec_sql helper function using raw SQL endpoint
async function bootstrapExecFunction() {
  // Try the pgsql endpoint 
  const sql = `
    CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$;
    GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
  `;
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql_query: sql })
  });
  console.log('Bootstrap status:', response.status);
  console.log('Bootstrap body:', await response.text());
}

// Try to check what functions exist
async function checkFunctions() {
  const { data, error } = await supabase.rpc('version');
  console.log('Version:', data, 'Error:', JSON.stringify(error));
}

await checkFunctions();

// Let's try to see if there's some way to run SQL...
// Check supabase health
const health = await fetch(`${SUPABASE_URL}/rest/v1/`, {
  headers: {
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'apikey': SERVICE_KEY,
  }
});
const healthData = await health.json();
console.log('Paths:', Object.keys(healthData.paths || {}).slice(0, 20));

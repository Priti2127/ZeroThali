// Applies the ZeroThali database schema using Supabase Management API + service role
// Uses the correct anon key and service role key from Vercel env vars

const SUPABASE_URL = "https://phwivinxfxugyknclrob.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBod2l2aW54Znh1Z3lrbmNscm9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzUxNDQzNSwiZXhwIjoyMTA5MDkwNDM1fQ.i0BybXROWbdOMH4uGELBc237ttI0tokDQiqNIBEPKWQ";
const PROJECT_REF = "phwivinxfxugyknclrob";

// Each SQL statement to run via the Management API
const SQL_STATEMENTS = [
  // Create messes table
  `CREATE TABLE IF NOT EXISTS public.messes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
  )`,
  
  // Create food_logs table
  `CREATE TABLE IF NOT EXISTS public.food_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mess_id uuid REFERENCES public.messes(id) ON DELETE SET NULL,
    staff_id uuid,
    food_item text NOT NULL,
    quantity_kg numeric NOT NULL,
    cooked_at timestamptz,
    condition text CHECK (condition IN ('edible','unfit')) NOT NULL,
    photo_url text,
    status text CHECK (status IN ('available','claimed','collected','biogas')) NOT NULL DEFAULT 'available',
    claim_code text,
    claimed_by uuid,
    claimed_at timestamptz,
    collected_at timestamptz,
    collection_photo text,
    created_at timestamptz DEFAULT now()
  )`,
  
  // Enable RLS
  `ALTER TABLE public.messes ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY`,
  
  // Drop existing policies (ignore errors)
  `DROP POLICY IF EXISTS "Anyone can read messes" ON public.messes`,
  `DROP POLICY IF EXISTS "Anyone can read food_logs" ON public.food_logs`,
  `DROP POLICY IF EXISTS "Auth users can insert food_logs" ON public.food_logs`,
  `DROP POLICY IF EXISTS "Auth users can update food_logs" ON public.food_logs`,
  
  // Create RLS policies - allow public read
  `CREATE POLICY "Anyone can read messes" ON public.messes FOR SELECT USING (true)`,
  `CREATE POLICY "Anyone can read food_logs" ON public.food_logs FOR SELECT USING (true)`,
  `CREATE POLICY "Auth users can insert food_logs" ON public.food_logs FOR INSERT TO authenticated WITH CHECK (true)`,
  `CREATE POLICY "Auth users can update food_logs" ON public.food_logs FOR UPDATE TO authenticated USING (true)`,
  
  // Create admin_kpi view
  `CREATE OR REPLACE VIEW public.admin_kpi AS
    SELECT
      COUNT(*) FILTER (WHERE condition = 'edible') AS total_edible,
      COALESCE(SUM(quantity_kg) FILTER (WHERE condition = 'edible'), 0) AS kg_edible,
      COUNT(*) FILTER (WHERE condition = 'unfit') AS total_unfit,
      COALESCE(SUM(quantity_kg) FILTER (WHERE condition = 'unfit'), 0) AS kg_unfit,
      ROUND(COALESCE(SUM(quantity_kg) FILTER (WHERE condition = 'unfit'), 0) * 0.12, 2) AS biogas_m3,
      ROUND(COALESCE(SUM(quantity_kg) FILTER (WHERE condition = 'unfit'), 0) * 0.12 * 0.43, 2) AS lpg_kg_saved
    FROM public.food_logs`,
  
  // Create biogas_queue view
  `CREATE OR REPLACE VIEW public.biogas_queue AS
    SELECT
      fl.id,
      fl.mess_id,
      m.name AS mess_name,
      fl.quantity_kg,
      fl.created_at
    FROM public.food_logs fl
    LEFT JOIN public.messes m ON m.id = fl.mess_id
    WHERE fl.condition = 'unfit' AND fl.status != 'biogas'`,
  
  // Seed data - messes
  `INSERT INTO public.messes (name) VALUES ('Main Mess'), ('North Mess'), ('South Mess') ON CONFLICT DO NOTHING`,
];

// Seed food_logs separately after messes are created
const SEED_FOOD_SQL = `
  INSERT INTO public.food_logs (mess_id, food_item, quantity_kg, cooked_at, condition, status)
  SELECT id, 'Veg Curry', 5, now() - interval '1 hour', 'edible', 'available'
  FROM public.messes WHERE name = 'Main Mess' LIMIT 1;
  
  INSERT INTO public.food_logs (mess_id, food_item, quantity_kg, cooked_at, condition, status)
  SELECT id, 'Dal Fry', 3, now() - interval '2 hours', 'edible', 'available'
  FROM public.messes WHERE name = 'North Mess' LIMIT 1;
  
  INSERT INTO public.food_logs (mess_id, food_item, quantity_kg, cooked_at, condition, status)
  SELECT id, 'Stale Rice', 8, now() - interval '6 hours', 'unfit', 'available'
  FROM public.messes WHERE name = 'South Mess' LIMIT 1;
`;

async function runSQL(sql) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql })
  });
  
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  
  return { status: response.status, data };
}

console.log("Applying ZeroThali schema to Supabase...\n");

for (let i = 0; i < SQL_STATEMENTS.length; i++) {
  const sql = SQL_STATEMENTS[i];
  const preview = sql.trim().split('\n')[0].substring(0, 60);
  process.stdout.write(`[${i+1}/${SQL_STATEMENTS.length}] ${preview}... `);
  
  const result = await runSQL(sql);
  if (result.status === 200 || result.status === 201) {
    console.log("✓");
  } else {
    console.log(`✗ (status ${result.status})`);
    console.log("  Response:", JSON.stringify(result.data));
  }
}

// Run seed data
console.log("\nSeeding food_logs...");
const seedResult = await runSQL(SEED_FOOD_SQL);
console.log(`Seed status: ${seedResult.status}`, JSON.stringify(seedResult.data));

console.log("\nDone! Verifying...");
const verifyResult = await runSQL("SELECT COUNT(*) FROM public.messes");
console.log("Messes count:", JSON.stringify(verifyResult.data));

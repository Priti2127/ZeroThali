import { createClient } from "@supabase/supabase-js";

const url = "https://phwivinxfxugyknclrob.supabase.co";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBod2l2aW54Znh1Z3lrbmNscm9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzUxNDQzNSwiZXhwIjoyMTA5MDkwNDM1fQ.i0BybXROWbdOMH4uGELBc237ttI0tokDQiqNIBEPKWQ";

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false }
});

// Test: try to read from messes
const { data, error } = await supabase.from("messes").select("*");
console.log("messes:", JSON.stringify(data), "error:", JSON.stringify(error));

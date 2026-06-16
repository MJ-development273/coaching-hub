import { createClient } from '@supabase/supabase-js'

// ─── FILL THESE IN AFTER CREATING YOUR SUPABASE PROJECT ───────────────────────
// 1. Go to https://supabase.com and create a free project
// 2. Go to Project Settings → API
// 3. Copy "Project URL" and "anon public" key and paste below
const SUPABASE_URL = https://bbbadcikbhshxofrefto.supabase.co
const SUPABASE_ANON_KEY = sb_publishable_Xin-unpJ3PCvTO2Jr-az7A_POxIzYvs
// ─────────────────────────────────────────────────────────────────────────────

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

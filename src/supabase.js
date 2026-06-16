import { createClient } from '@supabase/supabase-js'

// ─── FILL THESE IN AFTER CREATING YOUR SUPABASE PROJECT ───────────────────────
// 1. Go to https://supabase.com and create a free project
// 2. Go to Project Settings → API
// 3. Copy "Project URL" and "anon public" key and paste below
const SUPABASE_URL = 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'
// ─────────────────────────────────────────────────────────────────────────────

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

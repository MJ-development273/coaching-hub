import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bbbadcikbhshxofrefto.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_Xin-unpJ3PCvTO2Jr-az7A_POxIzYvs'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

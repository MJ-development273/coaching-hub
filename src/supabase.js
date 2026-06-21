import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bbbadcikbhshxofrefto.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiYmFkY2lrYmhzaHhvZnJlZnRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MzU5MzAsImV4cCI6MjA5NzIxMTkzMH0.HhoPkxopByzJgt9RPHWT4YQV7ZiLHYUg-QrAbGb0E4Q'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

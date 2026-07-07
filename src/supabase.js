import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ytpigebtmeihxkaguyjs.supabase.co'
const supabaseKey = 'sb_publishable_q-YtHLvSTajHJzm-Enav1A_oakg2OhN'

export const supabase = createClient(supabaseUrl, supabaseKey)

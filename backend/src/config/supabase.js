import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import ws from 'ws';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabaseOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    transport: ws,
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions);

export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, supabaseOptions)
  : null;
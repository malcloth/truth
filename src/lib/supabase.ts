import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client with service role key for admin operations
export const createAdminClient = () => {
  if (!supabaseServiceKey) {
    throw new Error('Missing VITE_SUPABASE_SERVICE_ROLE_KEY environment variable for admin operations.');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

export type UserTruth = {
  id?: string;
  x_username: string;
  first_question: string;
  first_answer: string;
  second_question: string;
  second_answer: string;
  generated_truth: string;
  created_at?: string;
  updated_at?: string;
};
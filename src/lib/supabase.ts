import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
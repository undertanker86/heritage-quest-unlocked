
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cusiltcmhkkcwynydpjy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1c2lsdGNtaGtrY3d5bnlkcGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM1NjcwNTYsImV4cCI6MjA0OTE0MzA1Nn0.example';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

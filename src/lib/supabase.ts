import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qbahoewrmbrhxmstnvje.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiYWhvZXdybWJyaHhtc3RudmplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NzM3OTEsImV4cCI6MjA4OTA0OTc5MX0._rDf12n3cNmOVkiUChPr76WrlFzGOXu64kndUiG7tjM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://spvmldruoksncedppgop.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwdm1sZHJ1b2tzbmNlZHBwZ29wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODcxMjUsImV4cCI6MjA4OTE2MzEyNX0.7p68IYvIJUeTGsynYrMMngclWDwQFWFzRAeXgKzX7QA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

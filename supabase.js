const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://dpsdjjztxosfutfqxdkd.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwc2Rqanp0eG9zZnV0ZnF4ZGtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzA3MzIsImV4cCI6MjA3NDc0NjczMn0.SVXDg7Kk9IbYLA7GecxXq-s8vynpt9MVgblywH6tesQ';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwc2Rqanp0eG9zZnV0ZnF4ZGtkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE3MDczMiwiZXhwIjoyMDc0NzQ2NzMyfQ.7YAgNO5FPf7L-OWvn9-xBzJeG1RpNcxPSbOeLSgKM_8';

// Client for regular operations
const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client with service role (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabase, supabaseAdmin };
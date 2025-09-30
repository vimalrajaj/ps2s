-- Disable RLS for development and create basic policies
-- Run this in your Supabase SQL Editor

-- Disable RLS on all tables for development
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;

-- Or if you want to keep RLS enabled, create permissive policies
-- (Uncomment the section below if you prefer to keep RLS)

/*
-- Enable RLS on all tables
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
CREATE POLICY "Allow all operations for service role" ON public.admins FOR ALL USING (true);
CREATE POLICY "Allow all operations for service role" ON public.departments FOR ALL USING (true);
CREATE POLICY "Allow all operations for service role" ON public.academic_years FOR ALL USING (true);
CREATE POLICY "Allow all operations for service role" ON public.classes FOR ALL USING (true);
CREATE POLICY "Allow all operations for service role" ON public.faculty FOR ALL USING (true);
CREATE POLICY "Allow all operations for service role" ON public.students FOR ALL USING (true);
*/
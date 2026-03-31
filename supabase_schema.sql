-- Supabase Schema for Duty-Leave Manager

-- 1. Create Profiles Table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    full_name TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Create Leaves Table
CREATE TABLE public.leaves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    event TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    type TEXT DEFAULT 'multi' CHECK (type IN ('single', 'multi')),
    subject_approvals JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for leaves
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

-- Students can read their own leaves, Admins can read all leaves
CREATE POLICY "Students can view own leaves, admins view all." 
ON public.leaves FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Students can insert their own leaves
CREATE POLICY "Students can insert own leaves." 
ON public.leaves FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can update leaves (e.g. status/approvals), Students can't (or maybe they can update pending ones)
CREATE POLICY "Admins can update leaves." 
ON public.leaves FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
    (auth.uid() = user_id AND status = 'Pending')
);

-- 3. Create Reminders Table
CREATE TABLE public.reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    event TEXT NOT NULL,
    doc_type TEXT NOT NULL,
    due_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for reminders
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own reminders." 
ON public.reminders FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own reminders." 
ON public.reminders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update own reminders." 
ON public.reminders FOR UPDATE USING (auth.uid() = user_id);

-- 4. Function & Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', COALESCE(new.raw_user_meta_data->>'role', 'student'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

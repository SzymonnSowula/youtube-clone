-- Create custom tables for YouTube Clone + Whop

-- Users Table (extends Supabase Auth)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  whop_id TEXT UNIQUE,
  email TEXT UNIQUE,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Channels Table (Users acting as Creators)
CREATE TABLE public.channels (
  id UUID REFERENCES public.users(id) NOT NULL PRIMARY KEY,
  channel_name TEXT UNIQUE NOT NULL,
  description TEXT,
  banner_url TEXT,
  whop_company_id TEXT UNIQUE,
  whop_product_id TEXT UNIQUE,
  whop_experience_id TEXT UNIQUE,
  whop_chat_channel_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Videos Table
CREATE TABLE public.videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.channels(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  views INTEGER DEFAULT 0,
  is_gated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Membership Tiers (Whop Plans)
CREATE TABLE public.membership_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.channels(id) NOT NULL,
  whop_plan_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Subscriptions 
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  channel_id UUID REFERENCES public.channels(id) NOT NULL,
  tier_id UUID REFERENCES public.membership_tiers(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, channel_id)
);

-- Security Policies (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to needed tables
CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Channels are viewable by everyone." ON public.channels FOR SELECT USING (true);
CREATE POLICY "Videos are viewable by everyone." ON public.videos FOR SELECT USING (true);
CREATE POLICY "Membership tiers are viewable by everyone." ON public.membership_tiers FOR SELECT USING (true);

-- Allow authenticated users to manage their own data
CREATE POLICY "Users can update own profile." ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile." ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Channel policies
CREATE POLICY "Channels can update own page." ON public.channels FOR ALL USING (auth.uid() = id);

-- Video policies
CREATE POLICY "Channels can insert videos." ON public.videos FOR INSERT WITH CHECK (auth.uid() = channel_id);
CREATE POLICY "Channels can update own videos." ON public.videos FOR UPDATE USING (auth.uid() = channel_id);
CREATE POLICY "Channels can delete own videos." ON public.videos FOR DELETE USING (auth.uid() = channel_id);

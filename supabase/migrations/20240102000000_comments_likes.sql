-- Comments Table (with nested replies via parent_id)
CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Video Likes / Dislikes
CREATE TABLE public.video_likes (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (user_id, video_id)
);

-- Comment Likes
CREATE TABLE public.comment_likes (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (user_id, comment_id)
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Comments: public read, authenticated write
CREATE POLICY "Comments are viewable by everyone." ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert comments." ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own comments." ON public.comments FOR DELETE USING (true);

-- Video likes: public read, authenticated write
CREATE POLICY "Video likes are viewable by everyone." ON public.video_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage video likes." ON public.video_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own video likes." ON public.video_likes FOR DELETE USING (true);

-- Comment likes: public read, authenticated write
CREATE POLICY "Comment likes are viewable by everyone." ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage comment likes." ON public.comment_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own comment likes." ON public.comment_likes FOR DELETE USING (true);

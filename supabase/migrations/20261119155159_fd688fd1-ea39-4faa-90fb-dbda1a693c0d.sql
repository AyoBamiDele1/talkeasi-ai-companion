DROP POLICY IF EXISTS "Authenticated users can view likes" ON public.post_likes;
CREATE POLICY "Users can view their own likes" ON public.post_likes FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Authenticated users can view community posts" ON public.community_posts;
CREATE POLICY "Users can view their own posts" ON public.community_posts FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Authenticated users can view comments" ON public.post_comments;
CREATE POLICY "Users can view their own comments" ON public.post_comments FOR SELECT TO authenticated USING (auth.uid() = user_id);
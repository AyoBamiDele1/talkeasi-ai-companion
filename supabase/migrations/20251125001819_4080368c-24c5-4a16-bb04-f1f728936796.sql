-- Fix Important Issues: User Data Management and Refund Capabilities

-- 1. Enable refund processing on credit_purchases
CREATE POLICY "Admins can update purchases for refunds" 
ON public.credit_purchases 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete purchases" 
ON public.credit_purchases 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- 2. Allow users to delete their conversation history
CREATE POLICY "Users can delete their own conversations" 
ON public.conversations 
FOR DELETE 
USING (auth.uid() = user_id);

-- 3. Allow users to manage their shared activities
CREATE POLICY "Users can update their own activities" 
ON public.sharing_activities 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" 
ON public.sharing_activities 
FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Allow users to manage achievements (for error correction)
CREATE POLICY "Users can update their own achievements" 
ON public.user_achievements 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own achievements" 
ON public.user_achievements 
FOR DELETE 
USING (auth.uid() = user_id);

-- 5. Allow users to delete incorrect progress records
CREATE POLICY "Users can delete their own progress" 
ON public.user_progress 
FOR DELETE 
USING (auth.uid() = user_id);
-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  requirement_type TEXT NOT NULL, -- 'lessons_completed', 'streak_days', 'accuracy_avg', 'total_sessions'
  requirement_value INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id),
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies for achievements (public read)
CREATE POLICY "Anyone can view achievements" 
ON public.achievements 
FOR SELECT 
USING (true);

-- RLS policies for user_achievements
CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Insert initial achievements
INSERT INTO public.achievements (name, description, icon, category, requirement_type, requirement_value, points) VALUES
('First Steps', 'Complete your first lesson', 'Award', 'beginner', 'lessons_completed', 1, 10),
('Getting Started', 'Complete 5 lessons', 'Star', 'progress', 'lessons_completed', 5, 20),
('Dedicated Learner', 'Complete 10 lessons', 'Trophy', 'progress', 'lessons_completed', 10, 50),
('Master Student', 'Complete 25 lessons', 'Crown', 'progress', 'lessons_completed', 25, 100),
('Consistency Champion', 'Maintain a 7-day streak', 'Target', 'streak', 'streak_days', 7, 30),
('Streak Master', 'Maintain a 30-day streak', 'Flame', 'streak', 'streak_days', 30, 100),
('Accuracy Expert', 'Achieve 90% average accuracy', 'CheckCircle', 'performance', 'accuracy_avg', 90, 50),
('Perfectionist', 'Achieve 95% average accuracy', 'Diamond', 'performance', 'accuracy_avg', 95, 75),
('Practice Makes Perfect', 'Complete 50 total sessions', 'Repeat', 'dedication', 'total_sessions', 50, 60),
('English Enthusiast', 'Complete 100 total sessions', 'Heart', 'dedication', 'total_sessions', 100, 150);

-- Create function to check and unlock achievements
CREATE OR REPLACE FUNCTION public.check_user_achievements(check_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    achievement_record RECORD;
    user_lessons_completed INTEGER;
    user_streak_days INTEGER;
    user_accuracy_avg DECIMAL;
    user_total_sessions INTEGER;
    achievement_met BOOLEAN;
BEGIN
    -- Get user stats
    SELECT 
        COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END),
        AVG(CASE WHEN accuracy_score IS NOT NULL THEN accuracy_score END),
        COUNT(*)
    INTO user_lessons_completed, user_accuracy_avg, user_total_sessions
    FROM user_progress 
    WHERE user_id = check_user_id;
    
    -- Get current streak (simplified - you may want to implement proper streak calculation)
    user_streak_days := COALESCE((
        SELECT COUNT(DISTINCT DATE(completed_at))
        FROM user_progress 
        WHERE user_id = check_user_id 
        AND completed_at >= NOW() - INTERVAL '30 days'
    ), 0);
    
    -- Check each achievement
    FOR achievement_record IN 
        SELECT a.* FROM achievements a
        WHERE a.id NOT IN (
            SELECT achievement_id FROM user_achievements 
            WHERE user_id = check_user_id
        )
    LOOP
        achievement_met := false;
        
        CASE achievement_record.requirement_type
            WHEN 'lessons_completed' THEN
                achievement_met := user_lessons_completed >= achievement_record.requirement_value;
            WHEN 'streak_days' THEN
                achievement_met := user_streak_days >= achievement_record.requirement_value;
            WHEN 'accuracy_avg' THEN
                achievement_met := COALESCE(user_accuracy_avg, 0) >= achievement_record.requirement_value;
            WHEN 'total_sessions' THEN
                achievement_met := user_total_sessions >= achievement_record.requirement_value;
        END CASE;
        
        -- Unlock achievement if met
        IF achievement_met THEN
            INSERT INTO user_achievements (user_id, achievement_id)
            VALUES (check_user_id, achievement_record.id)
            ON CONFLICT (user_id, achievement_id) DO NOTHING;
        END IF;
    END LOOP;
END;
$$;
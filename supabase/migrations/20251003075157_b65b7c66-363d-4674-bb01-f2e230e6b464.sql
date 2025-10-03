-- Insert the new "Friendly Chat" lesson
INSERT INTO public.lessons (
  title,
  description,
  difficulty,
  category,
  duration_minutes,
  is_premium,
  content
) VALUES (
  'Friendly Chat',
  'A casual, friendly chat to keep you company.',
  'Beginner',
  'AI Companion',
  15,
  false,
  jsonb_build_object(
    'conversation_type', 'free_form',
    'correction_style', 'gentle',
    'personality', 'adaptive',
    'welcome_message', 'Hey! What''s on your mind today?'
  )
);
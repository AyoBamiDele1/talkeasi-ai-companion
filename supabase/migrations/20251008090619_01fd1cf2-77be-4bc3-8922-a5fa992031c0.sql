-- Update lesson durations for MVP optimization
UPDATE public.lessons 
SET duration_minutes = 10 
WHERE title = 'Friendly Chat' AND difficulty = 'Beginner';

UPDATE public.lessons 
SET duration_minutes = 10 
WHERE title = 'Business Introduction' AND difficulty = 'Beginner';

UPDATE public.lessons 
SET duration_minutes = 15 
WHERE title = 'Phone Conversations' AND difficulty = 'Intermediate';

UPDATE public.lessons 
SET duration_minutes = 15 
WHERE title = 'Job Interview Practice' AND difficulty = 'Intermediate';

UPDATE public.lessons 
SET duration_minutes = 15 
WHERE title = 'Customer Service Excellence' AND difficulty = 'Intermediate';

UPDATE public.lessons 
SET duration_minutes = 20 
WHERE title = 'Presentation Skills' AND difficulty = 'Advanced';
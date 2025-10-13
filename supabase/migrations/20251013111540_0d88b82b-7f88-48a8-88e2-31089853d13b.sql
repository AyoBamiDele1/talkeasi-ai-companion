-- Update Phone Conversation lesson to Healthy Habits lesson
UPDATE lessons 
SET 
  title = 'Discussing Healthy Habits and Lifestyle',
  description = 'Learn how to talk about daily routines, fitness, food, and well-being.',
  category = 'Health & Wellness'
WHERE title = 'Phone Conversation';
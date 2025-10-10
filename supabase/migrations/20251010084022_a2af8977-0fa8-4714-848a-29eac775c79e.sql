-- Update "Friendly Chat" to 5 minutes
UPDATE lessons 
SET duration_minutes = 5,
    description = 'Practice casual English conversation with an AI coach who corrects every grammar and pronunciation mistake'
WHERE id = '9b25e5bb-3702-448f-aae7-39c0b44fb558';

-- Update "Job Interview Practice" to 5 minutes  
UPDATE lessons 
SET duration_minutes = 5,
    description = 'Perfect your interview skills with detailed corrections on every speaking error'
WHERE id = 'b1b45d3b-e8d4-4ff6-8184-3dcc8452c0a4';

-- Create or update "Phone Conversation" lesson
INSERT INTO lessons (id, title, difficulty, category, duration_minutes, description, is_premium, content)
VALUES (
  'a1c2e3f4-5678-90ab-cdef-1234567890ab',
  'Phone Conversation',
  'Intermediate',
  'Business Communication',
  5,
  'Master professional phone calls with instant feedback on your grammar and clarity',
  false,
  '{"scenario": "Business phone call", "focus": ["Phone etiquette", "Clear communication", "Professional language"]}'
)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    difficulty = EXCLUDED.difficulty,
    category = EXCLUDED.category,
    duration_minutes = EXCLUDED.duration_minutes,
    description = EXCLUDED.description,
    content = EXCLUDED.content;

-- Delete the other lessons
DELETE FROM lessons 
WHERE id NOT IN (
  '9b25e5bb-3702-448f-aae7-39c0b44fb558', -- Friendly Chat
  'b1b45d3b-e8d4-4ff6-8184-3dcc8452c0a4', -- Job Interview Practice
  'a1c2e3f4-5678-90ab-cdef-1234567890ab'  -- Phone Conversation
);
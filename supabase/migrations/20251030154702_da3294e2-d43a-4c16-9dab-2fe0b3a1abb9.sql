-- Update Friendly Chat lesson to AI Companion
UPDATE lessons 
SET 
  title = 'AI Companion',
  description = 'Talk freely — feel heard, supported, and understood',
  category = 'Companion',
  content = jsonb_set(
    jsonb_set(
      jsonb_set(
        content,
        '{conversation_type}',
        '"companion"'
      ),
      '{correction_style}',
      '"none"'
    ),
    '{personality}',
    '"warm_supportive_friend"'
  )
WHERE id = '9b25e5bb-3702-448f-aae7-39c0b44fb558';
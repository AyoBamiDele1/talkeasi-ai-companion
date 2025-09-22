-- Update lesson descriptions to remove Nigerian references
UPDATE public.lessons 
SET description = 'Learn how to introduce yourself professionally in business settings'
WHERE title = 'Business Introduction';

UPDATE public.lessons 
SET description = 'Master professional phone etiquette for business communications'
WHERE title = 'Phone Conversations';

-- Update lesson content to remove Nigerian cultural references
UPDATE public.lessons 
SET content = jsonb_set(
  content,
  '{scenarios}',
  '["Meeting new people from different cultures", "Discussing cultural traditions and customs", "Navigating social etiquette differences", "Participating in local community events", "Explaining your culture to others", "Understanding local social norms"]'::jsonb
)
WHERE title = 'Cultural Exchange Conversations';

-- Update profiles table default value for native_language
ALTER TABLE public.profiles ALTER COLUMN native_language SET DEFAULT 'English';

-- Update existing profiles that have 'Nigerian English' to 'English'
UPDATE public.profiles 
SET native_language = 'English' 
WHERE native_language = 'Nigerian English';
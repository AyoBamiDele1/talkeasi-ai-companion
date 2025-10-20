-- Update credit packages with new Option A pricing
UPDATE credit_packages 
SET price_ngn = 500 
WHERE name = 'Starter Pack';

UPDATE credit_packages 
SET price_ngn = 1000 
WHERE name = 'Popular Pack';

UPDATE credit_packages 
SET price_ngn = 1500 
WHERE name = 'Power Pack';
-- Update credit packages to match frontend/webhook values (source of truth)
-- This fixes the discrepancy between database (40/90/170/500) and code (50/100/200/600)

-- Update Bronze Pack
UPDATE credit_packages 
SET credits = 50 
WHERE name = 'Bronze Pack';

-- Update Silver Pack
UPDATE credit_packages 
SET credits = 100 
WHERE name = 'Silver Pack';

-- Update Gold Pack (also fix NGN pricing)
UPDATE credit_packages 
SET credits = 200, 
    price_ngn = 2500 
WHERE name = 'Gold Pack';

-- Update Monthly Pro (also fix NGN pricing and GBP pricing)
UPDATE credit_packages 
SET credits = 600, 
    price_ngn = 7500, 
    price_gbp = 8.00 
WHERE name = 'Monthly Pro';
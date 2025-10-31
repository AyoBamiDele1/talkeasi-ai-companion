-- Update Premium Mode credit package to new pricing
UPDATE credit_packages
SET 
  credits = 20,
  price_ngn = 2500
WHERE price_ngn = 2000 AND credits = 50 AND is_active = true;
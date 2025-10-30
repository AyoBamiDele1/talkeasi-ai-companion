-- Update the 50 credits package to ₦1,000 for better profitability
UPDATE credit_packages 
SET price_ngn = 1000 
WHERE credits = 50 AND price_ngn = 100;
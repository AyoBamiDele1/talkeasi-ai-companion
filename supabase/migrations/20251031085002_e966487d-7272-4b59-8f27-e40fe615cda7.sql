-- Update existing Enhanced Mode Pack to Standard Mode Pack
UPDATE credit_packages
SET name = 'Standard Mode Pack'
WHERE id = '132522d9-9b12-44f0-9827-0c1280443b33';

-- Insert Premium Mode Pack
INSERT INTO credit_packages (name, credits, price_ngn, bonus_percentage, display_order, is_active)
VALUES ('Premium Mode Pack', 50, 2000, 0, 2, true)
ON CONFLICT DO NOTHING;
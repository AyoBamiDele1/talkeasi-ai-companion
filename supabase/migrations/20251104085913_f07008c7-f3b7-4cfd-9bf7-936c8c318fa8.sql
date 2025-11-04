-- Add new columns to credit_packages table
ALTER TABLE public.credit_packages
ADD COLUMN price_usd NUMERIC(10, 2),
ADD COLUMN price_gbp NUMERIC(10, 2),
ADD COLUMN package_type TEXT NOT NULL DEFAULT 'one_time',
ADD COLUMN billing_interval TEXT;

-- Update existing packages to have default values
UPDATE public.credit_packages
SET price_usd = 0, price_gbp = 0
WHERE price_usd IS NULL;

-- Delete old packages
DELETE FROM public.credit_packages;

-- Insert new one-time packages
INSERT INTO public.credit_packages (name, credits, price_ngn, price_usd, price_gbp, package_type, bonus_percentage, is_active, display_order)
VALUES
  ('Bronze Pack', 40, 1000, 1.99, 1.59, 'one_time', 0, true, 1),
  ('Silver Pack', 90, 1500, 2.99, 2.39, 'one_time', 0, true, 2),
  ('Gold Pack', 170, 2000, 4.99, 3.99, 'one_time', 0, true, 3);

-- Insert monthly subscription
INSERT INTO public.credit_packages (name, credits, price_ngn, price_usd, price_gbp, package_type, billing_interval, bonus_percentage, is_active, display_order)
VALUES
  ('Monthly Pro', 500, 5000, 9.99, 7.99, 'monthly', 'month', 0, true, 4);

-- Update welcome credits from 5 to 8 in handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  
  -- Create credit balance with 8 welcome credits
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (NEW.id, 8);
  
  -- Log welcome bonus transaction
  INSERT INTO public.credit_transactions (user_id, type, amount, balance_after, description, metadata)
  VALUES (NEW.id, 'bonus', 8, 8, 'Welcome bonus - Try both modes free!', '{"source": "signup"}');
  
  RETURN NEW;
END;
$function$;
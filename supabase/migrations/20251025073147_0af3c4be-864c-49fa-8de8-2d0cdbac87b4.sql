-- Deactivate all existing packages
UPDATE credit_packages SET is_active = false;

-- Add new MVP package: ₦100 for 50 credits
INSERT INTO credit_packages (name, credits, price_ngn, bonus_percentage, display_order, is_active)
VALUES ('Enhanced Mode Pack', 50, 100, 0, 1, true);

-- Update welcome bonus from 2 to 5 credits
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
  
  -- Create credit balance with 5 welcome credits (updated from 2)
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (NEW.id, 5);
  
  -- Log welcome bonus transaction
  INSERT INTO public.credit_transactions (user_id, type, amount, balance_after, description, metadata)
  VALUES (NEW.id, 'bonus', 5, 5, 'Welcome bonus - Try Enhanced Mode free!', '{"source": "signup"}');
  
  RETURN NEW;
END;
$function$;
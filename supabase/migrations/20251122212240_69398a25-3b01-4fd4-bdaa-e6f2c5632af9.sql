-- Update handle_new_user function to provide 5 welcome credits instead of 8
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  
  -- Create credit balance with 5 welcome credits
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (NEW.id, 5);
  
  -- Log welcome bonus transaction
  INSERT INTO public.credit_transactions (user_id, type, amount, balance_after, description, metadata)
  VALUES (NEW.id, 'bonus', 5, 5, 'Welcome bonus', '{"source": "signup"}');
  
  RETURN NEW;
END;
$function$;
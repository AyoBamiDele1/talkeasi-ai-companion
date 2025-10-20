-- Update the handle_new_user function to grant 2 welcome credits instead of 5
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
  
  -- Create credit balance with 2 welcome credits
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (NEW.id, 2);
  
  -- Log welcome bonus transaction
  INSERT INTO public.credit_transactions (user_id, type, amount, balance_after, description, metadata)
  VALUES (NEW.id, 'bonus', 2, 2, 'Welcome bonus - 2 free credits', '{"source": "signup"}');
  
  RETURN NEW;
END;
$function$;
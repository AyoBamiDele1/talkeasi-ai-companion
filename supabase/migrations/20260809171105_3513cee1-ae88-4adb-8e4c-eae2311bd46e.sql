-- Update the handle_new_user trigger to read Google OAuth name fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Create profile using the best available name from OAuth metadata
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'display_name',
      NEW.email
    )
  );
  
  -- Create credit balance with 5 welcome credits
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (NEW.id, 5);
  
  -- Log welcome bonus transaction
  INSERT INTO public.credit_transactions (user_id, type, amount, balance_after, description, metadata)
  VALUES (NEW.id, 'bonus', 5, 5, 'Welcome bonus', '{"source": "signup"}');
  
  RETURN NEW;
END;
$function$;

-- Backfill existing Google OAuth users whose display_name is currently their email
UPDATE public.profiles
SET display_name = COALESCE(
  auth.users.raw_user_meta_data->>'full_name',
  auth.users.raw_user_meta_data->>'name',
  auth.users.raw_user_meta_data->>'display_name'
)
FROM auth.users
WHERE public.profiles.user_id = auth.users.id
  AND public.profiles.display_name = auth.users.email
  AND (
    auth.users.raw_user_meta_data->>'full_name' IS NOT NULL
    OR auth.users.raw_user_meta_data->>'name' IS NOT NULL
    OR auth.users.raw_user_meta_data->>'display_name' IS NOT NULL
  );
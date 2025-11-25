-- Fix search path for trigger function
CREATE OR REPLACE FUNCTION public.trigger_cleanup_rate_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only cleanup 1% of the time to reduce overhead
  IF random() < 0.01 THEN
    PERFORM public.cleanup_old_rate_limits();
  END IF;
  RETURN NEW;
END;
$$;
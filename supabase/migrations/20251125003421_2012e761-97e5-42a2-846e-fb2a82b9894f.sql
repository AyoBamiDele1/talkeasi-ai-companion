-- Create rate limiting table for payment endpoints
CREATE TABLE IF NOT EXISTS public.payment_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_payment_rate_limits_user_endpoint 
ON public.payment_rate_limits(user_id, endpoint, window_start);

-- RLS policies
ALTER TABLE public.payment_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can manage rate limits
CREATE POLICY "Service role can manage rate limits"
ON public.payment_rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Function to clean up old rate limit entries (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.payment_rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$;

-- Create a trigger to periodically clean up (runs on insert)
CREATE OR REPLACE FUNCTION public.trigger_cleanup_rate_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only cleanup 1% of the time to reduce overhead
  IF random() < 0.01 THEN
    PERFORM public.cleanup_old_rate_limits();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_rate_limits_trigger
AFTER INSERT ON public.payment_rate_limits
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_cleanup_rate_limits();
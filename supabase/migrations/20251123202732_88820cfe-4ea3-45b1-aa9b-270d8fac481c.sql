-- Create credit_purchases table to track purchase currency
CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credits_amount integer NOT NULL,
  price_paid numeric NOT NULL,
  currency text NOT NULL CHECK (currency IN ('NGN', 'USD', 'GBP')),
  stripe_session_id text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own purchases
CREATE POLICY "Users can view their own purchases"
  ON public.credit_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated inserts (for webhook function)
CREATE POLICY "Service role can insert purchases"
  ON public.credit_purchases FOR INSERT
  WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX idx_credit_purchases_user_id ON public.credit_purchases(user_id);
CREATE INDEX idx_credit_purchases_currency ON public.credit_purchases(user_id, currency);
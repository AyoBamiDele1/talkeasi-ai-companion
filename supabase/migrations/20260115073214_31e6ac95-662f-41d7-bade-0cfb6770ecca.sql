-- Create table for credit gifts
CREATE TABLE public.credit_gifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  credits_amount INTEGER NOT NULL CHECK (credits_amount > 0),
  message TEXT,
  gift_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  claimed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

-- Enable RLS
ALTER TABLE public.credit_gifts ENABLE ROW LEVEL SECURITY;

-- Sender can view their sent gifts
CREATE POLICY "Users can view their sent gifts"
ON public.credit_gifts
FOR SELECT
USING (auth.uid() = sender_id);

-- Users can view gifts sent to their email
CREATE POLICY "Users can view gifts sent to them"
ON public.credit_gifts
FOR SELECT
USING (
  recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR recipient_id = auth.uid()
);

-- Users can create gifts
CREATE POLICY "Users can create gifts"
ON public.credit_gifts
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Recipients can claim (update) their gifts
CREATE POLICY "Recipients can claim their gifts"
ON public.credit_gifts
FOR UPDATE
USING (
  recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR recipient_id = auth.uid()
);

-- Create index for fast lookups
CREATE INDEX idx_credit_gifts_sender ON public.credit_gifts(sender_id);
CREATE INDEX idx_credit_gifts_recipient_email ON public.credit_gifts(recipient_email);
CREATE INDEX idx_credit_gifts_gift_code ON public.credit_gifts(gift_code);
CREATE INDEX idx_credit_gifts_status ON public.credit_gifts(status);
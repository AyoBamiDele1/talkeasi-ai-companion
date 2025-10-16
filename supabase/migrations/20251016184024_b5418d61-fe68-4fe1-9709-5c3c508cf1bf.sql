-- User credit balances
CREATE TABLE user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Available credit packages
CREATE TABLE credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  credits integer NOT NULL,
  price_ngn integer NOT NULL,
  bonus_percentage integer DEFAULT 0,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Transaction history
CREATE TABLE credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('purchase', 'usage', 'bonus', 'refund')),
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- RLS Policies
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view credit packages"
  ON credit_packages FOR SELECT
  USING (is_active = true);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Update handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  
  -- Create credit balance with 5 welcome credits
  INSERT INTO public.user_credits (user_id, balance)
  VALUES (NEW.id, 5);
  
  -- Log welcome bonus transaction
  INSERT INTO public.credit_transactions (user_id, type, amount, balance_after, description, metadata)
  VALUES (NEW.id, 'bonus', 5, 5, 'Welcome bonus - 5 free credits', '{"source": "signup"}');
  
  RETURN NEW;
END;
$$;

-- Seed credit packages
INSERT INTO credit_packages (name, credits, price_ngn, bonus_percentage, display_order) VALUES
  ('Starter Pack', 100, 500, 0, 1),
  ('Popular Pack', 350, 1500, 17, 2),
  ('Power Pack', 750, 3000, 25, 3);
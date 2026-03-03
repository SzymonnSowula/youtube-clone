-- Webhook events audit log
CREATE TABLE public.webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  whop_event_id TEXT UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}',
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Payment records (local cache of Whop payments)
CREATE TABLE public.payment_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
  whop_payment_id TEXT UNIQUE NOT NULL,
  amount DECIMAL NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending',
  billing_reason TEXT,
  card_brand TEXT,
  card_last4 TEXT,
  user_email TEXT,
  user_name TEXT,
  whop_user_id TEXT,
  refunded_amount DECIMAL DEFAULT 0,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- Webhook events: no public access (service role only)
CREATE POLICY "Service role can manage webhook events." ON public.webhook_events FOR ALL USING (true);

-- Payment records: creators can read their own, service role can insert
CREATE POLICY "Payment records viewable by channel owner." ON public.payment_records FOR SELECT USING (true);
CREATE POLICY "Service role can insert payment records." ON public.payment_records FOR INSERT WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_payment_records_channel_id ON public.payment_records(channel_id);
CREATE INDEX idx_payment_records_paid_at ON public.payment_records(paid_at);
CREATE INDEX idx_webhook_events_event_type ON public.webhook_events(event_type);

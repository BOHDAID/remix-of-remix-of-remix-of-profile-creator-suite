-- Create table for CAPTCHA learning data
CREATE TABLE public.captcha_learning (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  captcha_type TEXT NOT NULL,
  image_hash TEXT,
  prompt TEXT,
  solution TEXT NOT NULL,
  was_correct BOOLEAN NOT NULL DEFAULT false,
  confidence DECIMAL(3,2),
  site_domain TEXT,
  attempt_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_captcha_learning_type ON public.captcha_learning(captcha_type);
CREATE INDEX idx_captcha_learning_hash ON public.captcha_learning(image_hash);
CREATE INDEX idx_captcha_learning_correct ON public.captcha_learning(was_correct);

-- Enable RLS (public table for now since this is a desktop app)
ALTER TABLE public.captcha_learning ENABLE ROW LEVEL SECURITY;

-- Allow public access for desktop app (no auth required)
CREATE POLICY "Allow public access to captcha_learning" 
ON public.captcha_learning 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create table for saved sessions
CREATE TABLE public.saved_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  site_name TEXT NOT NULL,
  full_url TEXT,
  cookies JSONB DEFAULT '[]'::jsonb,
  local_storage JSONB DEFAULT '{}'::jsonb,
  session_storage JSONB DEFAULT '{}'::jsonb,
  tokens JSONB DEFAULT '[]'::jsonb,
  headers JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active',
  login_state TEXT DEFAULT 'unknown',
  metadata JSONB DEFAULT '{}'::jsonb,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_saved_sessions_profile ON public.saved_sessions(profile_id);
CREATE INDEX idx_saved_sessions_domain ON public.saved_sessions(domain);
CREATE UNIQUE INDEX idx_saved_sessions_profile_domain ON public.saved_sessions(profile_id, domain);

-- Enable RLS
ALTER TABLE public.saved_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public access for desktop app
CREATE POLICY "Allow public access to saved_sessions" 
ON public.saved_sessions 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create table for login credentials
CREATE TABLE public.saved_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  site_name TEXT NOT NULL,
  username TEXT,
  email TEXT,
  encrypted_password TEXT,
  login_url TEXT,
  auto_login BOOLEAN DEFAULT true,
  two_factor_enabled BOOLEAN DEFAULT false,
  selectors JSONB DEFAULT '{}'::jsonb,
  custom_data JSONB DEFAULT '{}'::jsonb,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_saved_credentials_profile ON public.saved_credentials(profile_id);
CREATE INDEX idx_saved_credentials_domain ON public.saved_credentials(domain);
CREATE UNIQUE INDEX idx_saved_credentials_profile_domain ON public.saved_credentials(profile_id, domain);

-- Enable RLS
ALTER TABLE public.saved_credentials ENABLE ROW LEVEL SECURITY;

-- Allow public access for desktop app
CREATE POLICY "Allow public access to saved_credentials" 
ON public.saved_credentials 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create update trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers
CREATE TRIGGER update_captcha_learning_updated_at
BEFORE UPDATE ON public.captcha_learning
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_sessions_updated_at
BEFORE UPDATE ON public.saved_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_credentials_updated_at
BEFORE UPDATE ON public.saved_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
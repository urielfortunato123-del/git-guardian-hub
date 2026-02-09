
-- Table for license keys
CREATE TABLE public.licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key TEXT NOT NULL UNIQUE,
  user_email TEXT,
  hardware_id TEXT,
  max_activations INT NOT NULL DEFAULT 1,
  current_activations INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_heartbeat_at TIMESTAMP WITH TIME ZONE
);

-- Index for fast lookup
CREATE INDEX idx_licenses_key ON public.licenses (license_key);

-- Table for activation records
CREATE TABLE public.license_activations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  hardware_id TEXT NOT NULL,
  ip_address TEXT,
  activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(license_id, hardware_id)
);

CREATE INDEX idx_activations_license ON public.license_activations (license_id);

-- Enable RLS
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_activations ENABLE ROW LEVEL SECURITY;

-- Only edge functions (service role) can access these tables
-- No public access policies needed - all access goes through edge functions

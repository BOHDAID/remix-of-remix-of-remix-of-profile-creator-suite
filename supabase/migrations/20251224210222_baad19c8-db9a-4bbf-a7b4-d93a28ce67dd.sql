-- جدول أكواد الربط (Pairing Codes)
CREATE TABLE public.pairing_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  device_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- فهرس لتسريع البحث بالكود
CREATE INDEX idx_pairing_codes_code ON public.pairing_codes(code);
CREATE INDEX idx_pairing_codes_active ON public.pairing_codes(is_active, expires_at);

-- تمكين RLS
ALTER TABLE public.pairing_codes ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة العامة للأكواد النشطة (الإضافة تتحقق من صلاحية الكود)
CREATE POLICY "Anyone can check pairing code validity"
ON public.pairing_codes
FOR SELECT
USING (is_active = true AND expires_at > now());

-- سياسة الإدخال العامة (التطبيق ينشئ كود)
CREATE POLICY "Anyone can create pairing code"
ON public.pairing_codes
FOR INSERT
WITH CHECK (true);

-- سياسة التحديث العامة (لتحديث used_at)
CREATE POLICY "Anyone can update pairing code"
ON public.pairing_codes
FOR UPDATE
USING (is_active = true);

-- جدول الجلسات المعلقة (Pending Sessions) - تُرسلها الإضافة
CREATE TABLE public.pending_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pairing_code TEXT NOT NULL,
  session_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fetched_at TIMESTAMP WITH TIME ZONE
);

-- فهرس للبحث بكود الربط
CREATE INDEX idx_pending_sessions_code ON public.pending_sessions(pairing_code);

-- تمكين RLS
ALTER TABLE public.pending_sessions ENABLE ROW LEVEL SECURITY;

-- سياسة الإدخال العامة (الإضافة ترسل الجلسة)
CREATE POLICY "Anyone can insert pending session"
ON public.pending_sessions
FOR INSERT
WITH CHECK (true);

-- سياسة القراءة العامة (التطبيق يستلم الجلسات)
CREATE POLICY "Anyone can read pending sessions"
ON public.pending_sessions
FOR SELECT
USING (fetched_at IS NULL);

-- سياسة التحديث (لتحديث fetched_at)
CREATE POLICY "Anyone can mark session as fetched"
ON public.pending_sessions
FOR UPDATE
USING (true);

-- سياسة الحذف للجلسات القديمة
CREATE POLICY "Anyone can delete old pending sessions"
ON public.pending_sessions
FOR DELETE
USING (fetched_at IS NOT NULL OR created_at < now() - interval '1 hour');
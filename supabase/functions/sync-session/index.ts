import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, pairingCode, sessions } = await req.json();
    console.log(`[sync-session] Action: ${action}, Code: ${pairingCode}`);

    // التحقق من صلاحية كود الربط
    if (action === 'verify') {
      const { data: codeData, error: codeError } = await supabase
        .from('pairing_codes')
        .select('id, code, expires_at')
        .eq('code', pairingCode)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (codeError) {
        console.error('[sync-session] Code verification error:', codeError);
        return new Response(
          JSON.stringify({ success: false, error: 'خطأ في التحقق من الكود' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!codeData) {
        return new Response(
          JSON.stringify({ success: false, error: 'كود الربط غير صالح أو منتهي' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[sync-session] Code verified:', codeData.code);
      return new Response(
        JSON.stringify({ success: true, message: 'الكود صالح' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // إرسال الجلسات من الإضافة
    if (action === 'push') {
      if (!pairingCode || !sessions || !Array.isArray(sessions)) {
        return new Response(
          JSON.stringify({ success: false, error: 'بيانات ناقصة' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // التحقق من الكود أولاً
      const { data: codeData, error: codeError } = await supabase
        .from('pairing_codes')
        .select('id')
        .eq('code', pairingCode)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (codeError || !codeData) {
        console.error('[sync-session] Invalid code on push:', codeError);
        return new Response(
          JSON.stringify({ success: false, error: 'كود الربط غير صالح أو منتهي' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // إدخال الجلسات
      const pendingSessions = sessions.map((session: any) => ({
        pairing_code: pairingCode,
        session_data: session,
      }));

      const { error: insertError } = await supabase
        .from('pending_sessions')
        .insert(pendingSessions);

      if (insertError) {
        console.error('[sync-session] Insert error:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: 'فشل حفظ الجلسات' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // تحديث الكود كمستخدم
      await supabase
        .from('pairing_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('code', pairingCode);

      console.log(`[sync-session] Pushed ${sessions.length} sessions for code ${pairingCode}`);
      return new Response(
        JSON.stringify({ success: true, count: sessions.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // استلام الجلسات من التطبيق
    if (action === 'pull') {
      if (!pairingCode) {
        return new Response(
          JSON.stringify({ success: false, error: 'كود الربط مطلوب' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: pendingData, error: fetchError } = await supabase
        .from('pending_sessions')
        .select('id, session_data')
        .eq('pairing_code', pairingCode)
        .is('fetched_at', null);

      if (fetchError) {
        console.error('[sync-session] Fetch error:', fetchError);
        return new Response(
          JSON.stringify({ success: false, error: 'فشل جلب الجلسات' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!pendingData || pendingData.length === 0) {
        return new Response(
          JSON.stringify({ success: true, sessions: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // تحديد كمستلمة
      const ids = pendingData.map(p => p.id);
      await supabase
        .from('pending_sessions')
        .update({ fetched_at: new Date().toISOString() })
        .in('id', ids);

      const sessions = pendingData.map(p => p.session_data);
      console.log(`[sync-session] Pulled ${sessions.length} sessions for code ${pairingCode}`);

      return new Response(
        JSON.stringify({ success: true, sessions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'إجراء غير معروف' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[sync-session] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'خطأ غير معروف' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

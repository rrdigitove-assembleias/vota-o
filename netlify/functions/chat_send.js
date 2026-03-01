export default async (req, context) => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "content-type, authorization",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
    };

    if (req.method === "OPTIONS") {
      return new Response("", { status: 204, headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return new Response(JSON.stringify({ error: "Missing env vars" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      assembly_id,
      mode = "public",
      unit_key = null,
      sender_role,
      sender_name,
      message,
      reply_to_id = null,
    } = body;

    if (!assembly_id || !sender_role || !sender_name || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (mode === "private" && !unit_key) {
      return new Response(JSON.stringify({ error: "unit_key required for private mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limites: morador 150, adm 300
    const maxLen = sender_role === "ADM" ? 300 : 150;
    const msg = String(message).trim().slice(0, maxLen);

    const payload = {
      assembly_id,
      mode,
      unit_key: mode === "private" ? unit_key : null,
      sender_role,
      sender_name,
      message: msg,
      reply_to_id,
    };

    const sbUrl = `${SUPABASE_URL}/rest/v1/chat_messages`;

    const r = await fetch(sbUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    if (!r.ok) {
      return new Response(JSON.stringify({ error: "supabase_error", status: r.status, body: text }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(text, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "server_error", detail: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
};

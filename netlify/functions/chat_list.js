export default async (req, context) => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // CORS básico (para o browser permitir)
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "content-type, authorization",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
    };

    if (req.method === "OPTIONS") {
      return new Response("", { status: 204, headers: corsHeaders });
    }

    if (req.method !== "GET") {
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

    const url = new URL(req.url);

    const assembly_id = url.searchParams.get("assembly_id");
    const mode = url.searchParams.get("mode") || "public"; // public|private
    const unit_key = url.searchParams.get("unit_key");     // obrigatório se private
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "100", 10), 300);
    const after_id = url.searchParams.get("after_id"); // opcional (para buscar só novas)

    if (!assembly_id) {
      return new Response(JSON.stringify({ error: "assembly_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (mode === "private" && !unit_key) {
      return new Response(JSON.stringify({ error: "unit_key is required for private mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Monta filtros do Supabase REST
    const params = new URLSearchParams();
    params.set("select", "id,assembly_id,mode,unit_key,sender_role,sender_name,message,reply_to_id,created_at");
    params.append("assembly_id", `eq.${assembly_id}`);
    params.append("mode", `eq.${mode}`);
    if (mode === "private") params.append("unit_key", `eq.${unit_key}`);
    if (after_id) params.append("id", `gt.${after_id}`);
    params.set("order", "id.asc");
    params.set("limit", String(limit));

    const sbUrl = `${SUPABASE_URL}/rest/v1/chat_messages?${params.toString()}`;

    const r = await fetch(sbUrl, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
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

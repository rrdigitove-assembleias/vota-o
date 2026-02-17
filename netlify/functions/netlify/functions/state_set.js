const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "POST, OPTIONS"
        },
        body: ""
      };
    }

    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createClient(supabaseUrl, serviceKey);

    const body = JSON.parse(event.body || "{}");
    const state = body?.state ?? body; // aceita {state:...} ou o objeto direto

    if (!state || typeof state !== "object") {
      return { statusCode: 400, body: "Invalid state" };
    }

    const { error } = await supabase
      .from("rr_digivote_state")
      .upsert({
        id: "MAIN",
        data: state,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: String(e?.message || e) })
    };
  }
};

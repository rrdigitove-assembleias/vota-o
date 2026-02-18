const { createClient } = require("@supabase/supabase-js");

exports.handler = async () => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data, error } = await supabase
      .from("rr_digivote_state")
      .select("data")
      .eq("id", "MAIN")
      .single();

    if (error) throw error;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({ ok: true, state: data?.data || {} })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: String(e?.message || e) })
    };
  }
};

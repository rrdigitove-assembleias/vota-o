const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, serviceKey);

  const body = JSON.parse(event.body || "{}");

  const { error } = await supabase
    .from("rr_digivote_state")
    .upsert({ id: "MAIN", data: body });

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true })
  };
};

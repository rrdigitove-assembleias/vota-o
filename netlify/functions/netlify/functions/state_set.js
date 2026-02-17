const { createClient } = require("@supabase/supabase-js");

exports.handler = async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data, error } = await supabase
    .from("rr_digivote_state")
    .select("data")
    .eq("id", "MAIN")
    .single();

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data.data || {})
  };
};


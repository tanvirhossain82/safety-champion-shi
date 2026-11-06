import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ROLES = ["admin", "hr", "safety", "dept_head"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await caller.auth.getUser();
    if (userError || !userData.user) return json({ error: "You must be signed in." }, 401);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: callerProfile, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (callerProfile?.role !== "admin") {
      return json({ error: "Only administrators can add users." }, 403);
    }

    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const fullName = String(body.full_name ?? "").trim();
    const role = String(body.role ?? "");
    const department = body.department ? String(body.department).trim() : null;

    if (!fullName) return json({ error: "Full name is required." }, 400);
    if (!EMAIL_PATTERN.test(email)) return json({ error: "Enter a valid email address." }, 400);
    if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400);
    if (!ROLES.includes(role)) return json({ error: "Choose a valid role." }, 400);

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createError || !created.user) {
      return json({ error: createError?.message ?? "Could not create the user." }, 400);
    }

    const newId = created.user.id;
    const { error: updateError } = await admin
      .from("profiles")
      .update({ full_name: fullName, role, department })
      .eq("id", newId);
    if (updateError) {
      await admin.auth.admin.deleteUser(newId);
      throw updateError;
    }

    return json({ id: newId, email });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error while adding the user.";
    return json({ error: message }, 500);
  }
});

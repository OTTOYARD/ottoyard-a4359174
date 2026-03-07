import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin using their JWT
    const authHeader = req.headers.get("authorization") ?? "";
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user: caller },
    } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleRow } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "list";

    // LIST users
    if (action === "list") {
      const search = (url.searchParams.get("search") || "").trim().toLowerCase();
      const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
      const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get("per_page") || "50")));

      // Get all auth users via admin API
      const { data: authData, error: authError } =
        await adminClient.auth.admin.listUsers({ page, perPage });

      if (authError) {
        return new Response(JSON.stringify({ error: authError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userIds = authData.users.map((u) => u.id);

      // Get profiles
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("user_id, full_name, username, company_name, phone, billing_email, account_summary_jsonb, created_at")
        .in("user_id", userIds);

      // Get roles
      const { data: roles } = await adminClient
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      const roleMap = new Map((roles || []).map((r) => [r.user_id, r.role]));

      let users = authData.users.map((u) => {
        const profile = profileMap.get(u.id);
        return {
          id: u.id,
          email: u.email,
          full_name: profile?.full_name || null,
          username: profile?.username || null,
          company_name: profile?.company_name || null,
          phone: profile?.phone || null,
          billing_email: profile?.billing_email || null,
          role: roleMap.get(u.id) || "user",
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          account_summary: profile?.account_summary_jsonb || null,
          email_confirmed_at: u.email_confirmed_at,
        };
      });

      // Client-side search filter
      if (search) {
        users = users.filter(
          (u) =>
            (u.email || "").toLowerCase().includes(search) ||
            (u.full_name || "").toLowerCase().includes(search) ||
            (u.company_name || "").toLowerCase().includes(search) ||
            (u.username || "").toLowerCase().includes(search)
        );
      }

      return new Response(
        JSON.stringify({ users, total: authData.users.length, page, perPage }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // DETAIL - single user
    if (action === "detail") {
      const userId = url.searchParams.get("user_id");
      if (!userId || !/^[0-9a-f-]{36}$/.test(userId)) {
        return new Response(JSON.stringify({ error: "Invalid user_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: authUser, error: authErr } =
        await adminClient.auth.admin.getUserById(userId);
      if (authErr || !authUser?.user) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: profile } = await adminClient
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      const { data: role } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      const { data: activityLogs } = await adminClient
        .from("activity_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      const { data: orders } = await adminClient
        .from("service_orders")
        .select("id, status, total_amount, currency, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      const { data: subscription } = await adminClient
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          user: {
            id: authUser.user.id,
            email: authUser.user.email,
            created_at: authUser.user.created_at,
            last_sign_in_at: authUser.user.last_sign_in_at,
            email_confirmed_at: authUser.user.email_confirmed_at,
            profile,
            role: role?.role || "user",
            activity_logs: activityLogs || [],
            orders: orders || [],
            subscription,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // UPDATE profile/role
    if (action === "update" && req.method === "POST") {
      const body = await req.json();
      const { user_id, updates, new_role } = body;

      if (!user_id || !/^[0-9a-f-]{36}$/.test(user_id)) {
        return new Response(JSON.stringify({ error: "Invalid user_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update profile fields
      if (updates && typeof updates === "object") {
        const allowedFields = [
          "full_name", "username", "company_name", "phone", "billing_email",
        ];
        const safeUpdates: Record<string, string> = {};
        for (const key of allowedFields) {
          if (key in updates) safeUpdates[key] = updates[key];
        }
        if (Object.keys(safeUpdates).length > 0) {
          const { error } = await adminClient
            .from("profiles")
            .update(safeUpdates)
            .eq("user_id", user_id);
          if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }

      // Update role
      if (new_role && ["admin", "moderator", "user"].includes(new_role)) {
        await adminClient
          .from("user_roles")
          .delete()
          .eq("user_id", user_id);
        const { error } = await adminClient
          .from("user_roles")
          .insert({ user_id, role: new_role });
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

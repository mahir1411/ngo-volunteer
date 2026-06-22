import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: r } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id)
      .maybeSingle();
    const role = r?.role;
    if (role === "ngo") throw redirect({ to: "/ngo/events" });
    if (role === "admin") throw redirect({ to: "/admin" });
    throw redirect({ to: "/volunteer/search" });
  },
  component: () => null,
});

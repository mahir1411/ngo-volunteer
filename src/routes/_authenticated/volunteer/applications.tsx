import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/volunteer/applications")({
  head: () => ({ meta: [{ title: "My applications — VolunteerConnect" }] }),
  component: Apps,
});

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warm/30 text-warm-foreground",
  accepted: "bg-primary/15 text-primary",
  waitlisted: "bg-accent/20 text-accent-foreground",
  rejected: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

function Apps() {
  const { user } = useAuth();
  const { data = [], refetch } = useQuery({
    queryKey: ["my-apps", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, status, message, applied_at, event_role_id, events(*), event_roles(role_name)")
        .eq("volunteer_id", user!.id)
        .order("applied_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const cancel = async (id: string) => {
    const { error } = await supabase
      .from("applications")
      .update({ status: "cancelled", decided_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Application cancelled");
      refetch();
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">My applications</h1>
      <div className="mt-6 space-y-3">
        {data.length === 0 && (
          <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
            No applications yet.{" "}
            <Link to="/volunteer/search" className="font-medium text-primary hover:underline">
              Find events →
            </Link>
          </div>
        )}
        {data.map((a: any) => (
          <div
            key={a.id}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/events/$id"
                  params={{ id: a.events.id }}
                  className="font-display text-lg font-semibold hover:text-primary"
                >
                  {a.events.title}
                </Link>
                <Badge className={`rounded-full capitalize ${STATUS_COLORS[a.status] || ""}`}>
                  {a.status}
                </Badge>
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {format(new Date(a.events.starts_at), "PPp")} ·{" "}
                {a.event_roles?.role_name || "Any role"}
              </div>
              {a.status === "accepted" && (
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  {a.events.contact_email && (
                    <a
                      className="inline-flex items-center gap-1.5 text-foreground hover:text-primary"
                      href={`mailto:${a.events.contact_email}`}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {a.events.contact_email}
                    </a>
                  )}
                  {a.events.contact_phone && (
                    <a
                      className="inline-flex items-center gap-1.5 text-foreground hover:text-primary"
                      href={`tel:${a.events.contact_phone}`}
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {a.events.contact_phone}
                    </a>
                  )}
                </div>
              )}
            </div>
            {(a.status === "pending" || a.status === "waitlisted" || a.status === "accepted") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => cancel(a.id)}
                className="rounded-xl"
              >
                <X className="mr-1 h-4 w-4" />
                Withdraw
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

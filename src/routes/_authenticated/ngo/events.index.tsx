import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus, Calendar, Users, BadgeCheck, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/ngo/events/")({
  head: () => ({ meta: [{ title: "My events — VolunteerConnect" }] }),
  component: NgoEvents,
});

function NgoEvents() {
  const { user } = useAuth();
  const { data: ngo, refetch: refetchNgo } = useQuery({
    queryKey: ["ngo-self", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("ngo_profiles").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });

  // Auto-verify NGO for testing/preview purposes if verification_status is pending
  useEffect(() => {
    if (user && ngo && ngo.verification_status === "pending") {
      supabase
        .from("ngo_profiles")
        .update({ verification_status: "verified" })
        .eq("user_id", user.id)
        .then(({ error }) => {
          if (!error) {
            toast.success("Account auto-verified for preview!");
            refetchNgo();
          }
        });
    }
  }, [user, ngo, refetchNgo]);

  const { data: events = [], refetch } = useQuery({
    queryKey: ["ngo-events", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*, applications(id, status)")
        .eq("ngo_id", user!.id)
        .order("starts_at", { ascending: false });
      return data ?? [];
    },
  });

  const cancel = async (id: string) => {
    if (!confirm("Cancel this event? Applicants will be notified.")) return;
    const { error } = await supabase.from("events").update({ status: "cancelled" }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Event cancelled");
      refetch();
    }
  };

  const activeListingsCount = events.filter((e) => e.status !== "cancelled").length;

  let totalApplicants = 0;
  let totalAcceptedSpots = 0;
  let totalAvailableSpots = 0;

  events.forEach((e: any) => {
    const pending = e.applications?.filter((a: any) => a.status === "pending").length || 0;
    const accepted = e.applications?.filter((a: any) => a.status === "accepted").length || 0;
    totalApplicants += pending + accepted;
    totalAcceptedSpots += accepted;
    totalAvailableSpots += e.total_spots || 0;
  });

  const occupancyRate =
    totalAvailableSpots > 0 ? Math.round((totalAcceptedSpots / totalAvailableSpots) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground">
              {ngo?.org_name || "My NGO"}
            </h1>
            {ngo?.verification_status === "verified" && (
              <Badge className="rounded-full bg-primary/10 text-primary border-none font-bold">
                <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                Verified NGO
              </Badge>
            )}
            {ngo?.verification_status === "pending" && (
              <Badge
                variant="outline"
                className="rounded-full font-semibold border-primary/20 text-muted-foreground bg-primary/5"
              >
                <Clock className="mr-1 h-3.5 w-3.5" />
                Verification Pending
              </Badge>
            )}
            {ngo?.verification_status === "rejected" && (
              <Badge variant="destructive" className="rounded-full font-bold">
                Verification Rejected
              </Badge>
            )}
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Manage your opportunities, view applicants, and log volunteer attendance.
          </p>
        </div>
        <Link
          to="/ngo/events/new"
          className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs hover:opacity-90 active:scale-98 transition-all py-2.5 px-5 text-sm font-semibold cursor-pointer shrink-0"
        >
          <Plus className="mr-1.5 h-4.5 w-4.5" />
          Create Event
        </Link>
      </div>

      {/* Analytics Dashboard Grid */}
      <div className="grid gap-5 sm:grid-cols-3 mb-8">
        {/* Active Listings Card */}
        <div className="bg-card/45 border border-border/50 rounded-2xl p-5 backdrop-blur-xs flex items-center gap-4 shadow-xs">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">{activeListingsCount}</div>
            <div className="text-xs font-semibold text-muted-foreground">Active Listings</div>
          </div>
        </div>

        {/* Total Applicants Card */}
        <div className="bg-card/45 border border-border/50 rounded-2xl p-5 backdrop-blur-xs flex items-center gap-4 shadow-xs">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">{totalApplicants}</div>
            <div className="text-xs font-semibold text-muted-foreground">Total Applicants</div>
          </div>
        </div>

        {/* Avg Occupancy Rate Card */}
        <div className="bg-card/45 border border-border/50 rounded-2xl p-5 backdrop-blur-xs flex items-center gap-4 shadow-xs">
          <div className="h-12 w-12 rounded-xl bg-warm/20 flex items-center justify-center text-warm-foreground shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground">{occupancyRate}%</div>
            <div className="text-xs font-semibold text-muted-foreground">Average Occupancy</div>
          </div>
        </div>
      </div>

      {/* Events Grid Header */}
      <div className="flex items-center gap-2 mb-6">
        <h2 className="font-display text-xl font-bold tracking-tight">Published Events</h2>
        <Badge
          variant="outline"
          className="rounded-full font-bold px-2 py-0.5 border-border/50 bg-secondary/50 text-xs"
        >
          {events.length} total
        </Badge>
      </div>

      {events.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 p-16 text-center text-muted-foreground bg-card/10">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="font-display font-semibold text-base">No events created yet</h3>
          <p className="text-xs mt-1 mb-4 text-muted-foreground/80">
            Create your first volunteer event immediately to start recruiting volunteers.
          </p>
          <Link
            to="/ngo/events/new"
            className="inline-flex text-xs font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Create First Event
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e: any) => {
            const pending = e.applications?.filter((a: any) => a.status === "pending").length || 0;
            const accepted =
              e.applications?.filter((a: any) => a.status === "accepted").length || 0;
            const pct =
              e.total_spots > 0 ? Math.min(100, Math.round((accepted / e.total_spots) * 100)) : 0;

            return (
              <div
                key={e.id}
                className="relative flex flex-col justify-between rounded-2xl border border-border/40 bg-card p-6 shadow-xs hover:shadow-md hover:border-border/80 transition-all card-hover-effect"
              >
                <div>
                  {/* Category and Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/5 px-2.5 py-0.5 rounded-full">
                      {e.category || "Community"}
                    </span>
                    <div className="flex gap-1.5">
                      {e.status === "cancelled" && (
                        <Badge variant="destructive" className="rounded-full text-[10px] px-2 py-0">
                          Cancelled
                        </Badge>
                      )}
                      {e.status === "completed" && (
                        <Badge
                          variant="outline"
                          className="rounded-full text-[10px] px-2 py-0 border-emerald-500/20 text-emerald-500 bg-emerald-500/5"
                        >
                          Completed
                        </Badge>
                      )}
                      {e.status === "published" && (
                        <Badge
                          variant="outline"
                          className="rounded-full text-[10px] px-2 py-0 border-primary/20 text-primary bg-primary/5"
                        >
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-lg font-bold leading-snug text-foreground line-clamp-2">
                    {e.title}
                  </h3>

                  {/* Start Date */}
                  <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                      <span>{format(new Date(e.starts_at), "PPp")}</span>
                    </div>
                  </div>

                  {/* Progress Bar (Occupancy) */}
                  <div className="space-y-1.5 mt-5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Slots Filled</span>
                      <span className="text-foreground">
                        {pct}% ({accepted}/{e.total_spots} spots)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? "bg-emerald-500" : pct >= 75 ? "bg-warm-foreground" : "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-6 pt-4 border-t border-border/40 flex flex-col gap-2">
                  <Link
                    to="/ngo/events/$id/applicants"
                    params={{ id: e.id }}
                    className="inline-flex items-center justify-center w-full rounded-xl bg-primary text-primary-foreground hover:opacity-90 active:scale-98 transition-all py-2.5 font-semibold text-xs cursor-pointer shadow-xs"
                  >
                    Applicants CRM
                    {pending > 0 && (
                      <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white shrink-0">
                        {pending} pending
                      </span>
                    )}
                  </Link>

                  <div className="flex gap-2 w-full">
                    <Link
                      to="/ngo/events/$id/edit"
                      params={{ id: e.id }}
                      className="flex-1 inline-flex items-center justify-center rounded-xl border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-all text-xs py-2 cursor-pointer font-semibold"
                    >
                      Edit
                    </Link>
                    <Link
                      to="/events/$id"
                      params={{ id: e.id }}
                      className="flex-1 inline-flex items-center justify-center rounded-xl hover:bg-accent hover:text-accent-foreground transition-all text-xs py-2 cursor-pointer font-semibold"
                    >
                      View Site
                    </Link>
                    {e.status !== "cancelled" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl text-destructive hover:bg-destructive/5 text-xs py-4 cursor-pointer"
                        onClick={() => cancel(e.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

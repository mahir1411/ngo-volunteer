import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  CalendarDays,
  MapPin,
  Users,
  BadgeCheck,
  Mail,
  Phone,
  ArrowLeft,
  Flag,
  Globe,
  Info as InfoIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage-url";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/events/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "Event details — KindLink" },
      { name: "description", content: `Event ${params.id} on KindLink.` },
    ],
  }),
  component: EventDetail,
});

function EventDetail() {
  const { id } = Route.useParams();
  const { user, role } = useAuth();
  const nav = useNavigate();
  const [banner, setBanner] = useState<string | null>(null);
  const [roleId, setRoleId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [applying, setApplying] = useState(false);

  const { data: ev, refetch } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();
      if (eventError) throw eventError;

      const { data: rolesData, error: rolesError } = await supabase
        .from("event_roles")
        .select("*")
        .eq("event_id", id);
      if (rolesError) throw rolesError;

      const { data: ngoData, error: ngoError } = await supabase
        .from("ngo_profiles")
        .select("org_name, verification_status, website")
        .eq("user_id", eventData.ngo_id)
        .maybeSingle();
      if (ngoError) throw ngoError;

      return {
        ...eventData,
        ngo_profiles: ngoData,
        event_roles: rolesData || [],
      };
    },
  });

  const { data: myApp } = useQuery({
    queryKey: ["my-app", id, user?.id],
    enabled: !!user && role === "volunteer",
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("*")
        .eq("event_id", id)
        .eq("volunteer_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (ev?.banner_url) signedUrl("event-banners", ev.banner_url).then(setBanner);
  }, [ev?.banner_url]);

  useEffect(() => {
    if (ev?.event_roles?.[0] && !roleId) setRoleId(ev.event_roles[0].id);
  }, [ev, roleId]);

  if (!ev)
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center text-sm font-medium text-muted-foreground animate-pulse">
        Loading event details…
      </div>
    );

  const ngo = (ev as any).ngo_profiles;
  const roles = (ev as any).event_roles as Array<{
    id: string;
    role_name: string;
    spots_needed: number;
    spots_filled: number;
  }>;
  const filledTotal = roles.reduce((s, r) => s + r.spots_filled, 0);
  const remaining = Math.max(ev.total_spots - filledTotal, 0);

  const apply = async () => {
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    if (role !== "volunteer") {
      toast.error("Only volunteers can apply");
      return;
    }
    setApplying(true);
    const { error } = await supabase.from("applications").insert({
      event_id: id,
      volunteer_id: user.id,
      event_role_id: roleId || null,
      message: message || null,
    });
    setApplying(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Application sent!");
    refetch();
  };

  const reportEvent = async () => {
    const reason = prompt("Please enter the reason for reporting this event:");
    if (!reason || !reason.trim()) return;
    const { error } = await supabase.from("admin_reports").insert({
      reported_entity_type: "event",
      reported_entity_id: id,
      reason: reason.trim(),
      reporter_id: user?.id,
    } as never);
    if (error) toast.error(error.message);
    else toast.success("Thank you. Our admins will review this report.");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Button
        variant="ghost"
        size="sm"
        className="mb-5 rounded-xl text-muted-foreground/80 hover:text-foreground hover:bg-secondary cursor-pointer"
        onClick={() => history.back()}
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to Events
      </Button>

      {/* Main Grid Wrapper */}
      <div className="grid gap-8 lg:grid-cols-10">
        {/* Left 70% Column (7 Columns) */}
        <div className="lg:col-span-7 space-y-8">
          <div className="overflow-hidden rounded-[2rem] border border-border/40 bg-card shadow-xs">
            {/* Banner Image */}
            <div className="aspect-[21/9] w-full overflow-hidden bg-muted relative">
              {banner ? (
                <img src={banner} alt={ev.title} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-gradient-to-br from-primary/10 via-primary/5 to-accent/15 font-display text-6xl font-black text-primary/30">
                  {ev.title.charAt(0)}
                </div>
              )}
            </div>

            {/* Event Description Content */}
            <div className="p-6 md:p-10 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
                  {ev.category}
                </span>
                {ngo?.verification_status === "verified" && (
                  <Badge className="rounded-full bg-primary/15 text-primary border-none px-3 py-1 font-bold text-xs">
                    <BadgeCheck className="mr-1 h-3.5 w-3.5 inline-block align-text-bottom text-primary" />
                    Verified NGO
                  </Badge>
                )}
                {ev.status === "cancelled" && (
                  <Badge variant="destructive" className="rounded-full px-3 py-1 font-bold text-xs">
                    Cancelled
                  </Badge>
                )}
              </div>

              <div>
                <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl text-foreground">
                  {ev.title}
                </h1>
                {ngo && (
                  <div className="mt-2.5 flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <span>Hosted by</span>
                    <span className="font-bold text-foreground">{ngo.org_name}</span>
                    {ngo.website && (
                      <a
                        href={ngo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-0.5 ml-1"
                      >
                        <Globe className="h-3 w-3" /> Website
                      </a>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-border/30 pt-6">
                <h3 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-1.5">
                  <InfoIcon className="h-4.5 w-4.5 text-primary" /> Event Details
                </h3>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-muted-foreground">
                  {ev.description}
                </p>
              </div>

              {/* Info Metrics Grid */}
              <div className="grid gap-4 sm:grid-cols-3 border-t border-border/30 pt-6">
                <InfoCard
                  icon={CalendarDays}
                  label="Date & Time"
                  value={`${format(new Date(ev.starts_at), "PPp")} to ${format(new Date(ev.ends_at), "p")}`}
                />
                <InfoCard
                  icon={MapPin}
                  label="Location"
                  value={`${ev.address}${ev.pincode ? " · " + ev.pincode : ""}`}
                />
                <InfoCard
                  icon={Users}
                  label="Slots Available"
                  value={`${remaining} / ${ev.total_spots} spots remaining`}
                />
              </div>

              {/* Roles Requirement List */}
              {roles.length > 0 && (
                <div className="border-t border-border/30 pt-6">
                  <h3 className="font-display text-lg font-bold text-foreground mb-4">
                    Roles Needed
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {roles.map((r) => {
                      const spotsRemaining = Math.max(r.spots_needed - r.spots_filled, 0);
                      const fillPct =
                        r.spots_needed > 0
                          ? Math.min(100, Math.round((r.spots_filled / r.spots_needed) * 100))
                          : 0;
                      return (
                        <div
                          key={r.id}
                          className="rounded-2xl border border-border/40 bg-secondary/10 p-5 space-y-3"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm text-foreground">{r.role_name}</span>
                            <Badge className="bg-primary/10 text-primary border-none rounded-full font-bold text-xs">
                              {spotsRemaining} left
                            </Badge>
                          </div>

                          <div className="space-y-1">
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-300"
                                style={{ width: `${fillPct}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-muted-foreground font-semibold text-right">
                              {r.spots_filled} / {r.spots_needed} slots filled
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 30% Column (3 Columns) - Action Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          {/* Main Action Registration Card */}
          <aside className="rounded-3xl border border-border/40 bg-card p-6 shadow-xs space-y-6 glass-panel">
            {user && (role === "volunteer" || !role) ? (
              myApp ? (
                <div className="text-center py-6 space-y-4">
                  <span className="text-4xl">🎉</span>
                  <div className="font-display text-lg font-extrabold text-foreground">
                    Applied Successfully
                  </div>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    You have submitted your application. The NGO team will coordinate with you via
                    phone or email.
                  </p>
                  <div className="pt-2">
                    <Badge className="rounded-full px-4 py-1.5 capitalize font-bold bg-primary text-primary-foreground border-none shadow-xs">
                      Status: {myApp.status}
                    </Badge>
                  </div>
                  <Link
                    to="/volunteer/applications"
                    className="mt-6 inline-block text-xs font-semibold text-primary hover:underline"
                  >
                    View my applications list →
                  </Link>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground">
                      Register to Participate
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Submit an application immediately to lock in your spot.
                    </p>
                  </div>

                  {roles.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-muted-foreground uppercase">
                        Choose a role
                      </Label>
                      <Select value={roleId} onValueChange={setRoleId}>
                        <SelectTrigger className="rounded-xl border-border/60 bg-background/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {roles.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.role_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">
                      Introduce yourself
                    </Label>
                    <Textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Why do you want to volunteer for this event? Share any relevant experience..."
                      className="rounded-xl border-border/60 text-xs bg-background/50 resize-none"
                    />
                  </div>

                  <Button
                    onClick={apply}
                    disabled={applying || remaining === 0 || ev.status !== "published"}
                    className="w-full rounded-xl py-6 font-bold text-base cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99] shadow-sm bg-primary text-primary-foreground"
                  >
                    {remaining === 0 ? "Event Full" : applying ? "Submitting…" : "Apply for Event"}
                  </Button>
                </div>
              )
            ) : !user ? (
              <div className="text-center py-6 space-y-4">
                <span className="text-3xl">👋</span>
                <div className="font-display text-lg font-bold">Ready to make an impact?</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Log in as a volunteer to apply immediately and view contact information.
                </p>
                <Button
                  asChild
                  className="w-full rounded-xl py-6 font-bold text-base bg-primary text-primary-foreground shadow-xs cursor-pointer"
                >
                  <Link to="/auth">Sign in to apply</Link>
                </Button>
              </div>
            ) : null}

            {/* Contact details */}
            {user && (
              <div className="border-t border-border/30 pt-5 space-y-4">
                <div className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Contact Organizer
                </div>
                <div className="space-y-3 text-xs font-semibold text-foreground/80">
                  {ev.contact_email && (
                    <a
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-border/40 hover:bg-secondary/20 hover:text-primary transition-all truncate"
                      href={`mailto:${ev.contact_email}`}
                    >
                      <Mail className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{ev.contact_email}</span>
                    </a>
                  )}
                  {ev.contact_phone && (
                    <a
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-border/40 hover:bg-secondary/20 hover:text-primary transition-all"
                      href={`tel:${ev.contact_phone}`}
                    >
                      <Phone className="h-4 w-4 text-primary shrink-0" />
                      <span>{ev.contact_phone}</span>
                    </a>
                  )}
                </div>

                <div className="mt-4 border-t border-border/30 pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold text-xs py-4 cursor-pointer"
                    onClick={reportEvent}
                  >
                    <Flag className="mr-2 h-4 w-4" />
                    Report this event
                  </Button>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/40 bg-secondary/15 p-4.5 transition-all hover:bg-secondary/20">
      <Icon className="mt-0.5 h-4.5 w-4.5 text-primary shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-xs font-bold mt-1 text-foreground leading-snug">{value}</div>
      </div>
    </div>
  );
}

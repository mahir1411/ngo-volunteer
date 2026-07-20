import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BadgeCheck,
  X,
  Eye,
  ShieldOff,
  Shield,
  Users,
  Calendar,
  TrendingUp,
  Heart,
  Flag,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signedUrl } from "@/lib/storage-url";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — KindLink" }] }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (!data) throw redirect({ to: "/dashboard" });
  },
  component: Admin,
});

function Admin() {
  const { data: ngos = [], refetch } = useQuery({
    queryKey: ["admin-ngos"],
    queryFn: async () =>
      (await supabase.from("ngo_profiles").select("*").order("created_at", { ascending: false }))
        .data ?? [],
  });

  const { data: stats = { ngos: 0, volunteers: 0, events: 0, apps: 0 }, refetch: refetchStats } =
    useQuery({
      queryKey: ["admin-stats"],
      queryFn: async () => {
        const [ngoRes, volRes, evRes, appRes] = await Promise.all([
          supabase.from("ngo_profiles").select("*", { count: "exact", head: true }),
          supabase.from("volunteer_profiles").select("*", { count: "exact", head: true }),
          supabase.from("events").select("*", { count: "exact", head: true }),
          supabase.from("applications").select("*", { count: "exact", head: true }),
        ]);
        return {
          ngos: ngoRes.count ?? 0,
          volunteers: volRes.count ?? 0,
          events: evRes.count ?? 0,
          apps: appRes.count ?? 0,
        };
      },
    });

  const { data: reports = [], refetch: refetchReports } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () =>
      (
        await supabase
          .from("admin_reports")
          .select("*, profiles(full_name)")
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  const setStatus = async (
    uid: string,
    verification_status: "verified" | "rejected" | "pending",
  ) => {
    const { error } = await supabase
      .from("ngo_profiles")
      .update({ verification_status })
      .eq("user_id", uid);
    if (error) toast.error(error.message);
    else {
      toast.success("Updated");
      refetch();
      refetchStats();
    }
  };

  const toggleSuspend = async (uid: string, suspended: boolean) => {
    const { error } = await supabase
      .from("ngo_profiles")
      .update({ suspended: !suspended })
      .eq("user_id", uid);
    if (error) toast.error(error.message);
    else {
      refetch();
      refetchStats();
    }
  };

  const viewCert = async (path: string) => {
    const url = await signedUrl("ngo-docs", path);
    if (url) window.open(url, "_blank");
    else toast.error("Cert unavailable");
  };

  const resolveReport = async (reportId: string) => {
    const { error } = await supabase
      .from("admin_reports")
      .update({ status: "resolved" })
      .eq("id", reportId);
    if (error) toast.error(error.message);
    else {
      toast.success("Report resolved");
      refetchReports();
    }
  };

  const takeActionOnReport = async (report: any) => {
    if (report.reported_entity_type === "ngo") {
      const { error } = await supabase
        .from("ngo_profiles")
        .update({ suspended: true })
        .eq("user_id", report.reported_entity_id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("NGO suspended");
    } else {
      const { error } = await supabase
        .from("events")
        .update({ status: "cancelled" })
        .eq("id", report.reported_entity_id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Event cancelled");
    }
    await resolveReport(report.id);
  };

  const ngoTabs: Array<{ key: "pending" | "verified" | "rejected"; label: string }> = [
    { key: "pending", label: "Pending" },
    { key: "verified", label: "Verified" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Admin dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage platform, moderate reports, and verify organizations.
      </p>

      <Tabs defaultValue="ngos" className="mt-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="ngos">NGO Verification</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports Queue</TabsTrigger>
        </TabsList>

        {/* NGOs Tab */}
        <TabsContent value="ngos" className="mt-6">
          <Tabs defaultValue="pending">
            <TabsList>
              {ngoTabs.map((t) => (
                <TabsTrigger key={t.key} value={t.key}>
                  {t.label} ({ngos.filter((n: any) => n.verification_status === t.key).length})
                </TabsTrigger>
              ))}
            </TabsList>
            {ngoTabs.map((t) => (
              <TabsContent key={t.key} value={t.key} className="mt-4 space-y-3">
                {ngos
                  .filter((n: any) => n.verification_status === t.key)
                  .map((n: any) => (
                    <div
                      key={n.user_id}
                      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-display text-lg font-semibold">{n.org_name}</div>
                            {n.suspended && (
                              <Badge variant="destructive" className="rounded-full">
                                Suspended
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {n.contact_email} · Reg# {n.registration_number || "—"}
                          </div>
                          {n.address && (
                            <div className="text-xs text-muted-foreground">
                              {n.address} · {n.pincode}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {n.registration_cert_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => viewCert(n.registration_cert_url)}
                            >
                              <Eye className="mr-1 h-4 w-4" />
                              View cert
                            </Button>
                          )}
                          {t.key !== "verified" && (
                            <Button
                              size="sm"
                              className="rounded-xl"
                              onClick={() => setStatus(n.user_id, "verified")}
                            >
                              <BadgeCheck className="mr-1 h-4 w-4" />
                              Verify
                            </Button>
                          )}
                          {t.key !== "rejected" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-xl text-destructive"
                              onClick={() => setStatus(n.user_id, "rejected")}
                            >
                              <X className="mr-1 h-4 w-4" />
                              Reject
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => toggleSuspend(n.user_id, n.suspended)}
                          >
                            {n.suspended ? (
                              <>
                                <Shield className="mr-1 h-4 w-4" />
                                Unsuspend
                              </>
                            ) : (
                              <>
                                <ShieldOff className="mr-1 h-4 w-4" />
                                Suspend
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                {ngos.filter((n: any) => n.verification_status === t.key).length === 0 && (
                  <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
                    Nothing here.
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active NGOs
                </CardTitle>
                <BadgeCheck className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.ngos}</div>
                <p className="text-xs text-muted-foreground">Registered on platform</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Volunteers
                </CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.volunteers}</div>
                <p className="text-xs text-muted-foreground">Active community members</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Events Published
                </CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.events}</div>
                <p className="text-xs text-muted-foreground">Opportunities listed</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Applications
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.apps}</div>
                <p className="text-xs text-muted-foreground">Connections made</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-6">
          <div className="space-y-4">
            {reports
              .filter((r: any) => r.status === "pending")
              .map((r: any) => (
                <div key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="capitalize rounded-full">
                          {r.reported_entity_type} Reported
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ID: {r.reported_entity_id}
                        </span>
                      </div>
                      <div className="mt-2 text-sm font-medium">Reason for report:</div>
                      <div className="text-sm italic bg-muted/40 p-2.5 rounded-xl mt-1 text-foreground/90">
                        "{r.reason}"
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Reported by: {r.profiles?.full_name || "Anonymous Volunteer"} ·{" "}
                        {new Date(r.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => takeActionOnReport(r)}
                      >
                        {r.reported_entity_type === "ngo" ? (
                          <>
                            <ShieldOff className="mr-1 h-4 w-4" />
                            Suspend NGO
                          </>
                        ) : (
                          <>
                            <X className="mr-1 h-4 w-4" />
                            Cancel Event
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xl"
                        onClick={() => resolveReport(r.id)}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Dismiss report
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            {reports.filter((r: any) => r.status === "pending").length === 0 && (
              <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
                <Flag className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
                No pending reports. All clean!
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

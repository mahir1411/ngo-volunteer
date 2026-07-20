import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { Download, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { signedUrl } from "@/lib/storage-url";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/volunteer/certificates")({
  head: () => ({ meta: [{ title: "Certificates — KindLink" }] }),
  component: Certificates,
});

function Certificates() {
  const { user } = useAuth();
  const [stats, setStats] = useState<{ events_completed: number; hours_total: number }>({
    events_completed: 0,
    hours_total: 0,
  });

  const { data = [] } = useQuery({
    queryKey: ["my-certs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      supabase
        .from("volunteer_profiles")
        .select("events_completed, hours_total")
        .eq("user_id", user!.id)
        .maybeSingle()
        .then(({ data }) => data && setStats(data));
      const { data, error } = await supabase
        .from("certificates")
        .select("id, pdf_url, issued_at, application_id, applications(events(title, starts_at))")
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const download = async (path: string) => {
    const url = await signedUrl("certificates", path);
    if (url) window.open(url, "_blank");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Your impact</h1>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Events completed
          </div>
          <div className="mt-1 font-display text-4xl font-semibold text-primary">
            {stats.events_completed}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            Hours contributed
          </div>
          <div className="mt-1 font-display text-4xl font-semibold text-primary">
            {Number(stats.hours_total).toFixed(0)}
          </div>
        </div>
      </div>

      <h2 className="mt-10 font-display text-2xl font-semibold">Certificates</h2>
      <div className="mt-4 space-y-3">
        {data.length === 0 && (
          <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
            No certificates yet. They appear after an NGO marks you attended.
          </div>
        )}
        {data.map((c: any) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display font-semibold">{c.applications?.events?.title}</div>
                <div className="text-xs text-muted-foreground">
                  Issued {format(new Date(c.issued_at), "PPP")}
                </div>
              </div>
            </div>
            <Button onClick={() => download(c.pdf_url)} className="rounded-xl">
              <Download className="mr-1.5 h-4 w-4" />
              Download
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

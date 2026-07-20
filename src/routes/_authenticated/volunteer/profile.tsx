import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/volunteer/profile")({
  head: () => ({ meta: [{ title: "My profile — KindLink" }] }),
  component: VProfile,
});

function VProfile() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [p, setP] = useState({ full_name: "", phone: "", pincode: "", skills: "", bio: "" });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { data: vp }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, phone, pincode")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("volunteer_profiles")
          .select("skills, bio")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      setP({
        full_name: prof?.full_name || "",
        phone: prof?.phone || "",
        pincode: prof?.pincode || "",
        skills: (vp?.skills || []).join(", "),
        bio: vp?.bio || "",
      });
    })();
  }, [user?.id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    let lat: number | null = null,
      lng: number | null = null;
    try {
      const { geocodeAddress } = await import("@/lib/geocode.functions");
      const geo = await geocodeAddress({ data: { query: p.pincode } });
      lat = geo?.lat ?? null;
      lng = geo?.lng ?? null;
    } catch {
      /* */
    }
    const e1 = await supabase
      .from("profiles")
      .update({ full_name: p.full_name, phone: p.phone, pincode: p.pincode, lat, lng })
      .eq("id", user.id);
    const e2 = await supabase
      .from("volunteer_profiles")
      .update({
        skills: p.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        bio: p.bio,
      })
      .eq("user_id", user.id);
    setBusy(false);
    if (e1.error || e2.error) toast.error((e1.error || e2.error)!.message);
    else toast.success("Profile saved");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Volunteer profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Full name</Label>
                <Input
                  value={p.full_name}
                  onChange={(e) => setP({ ...p, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Pincode</Label>
              <Input value={p.pincode} onChange={(e) => setP({ ...p, pincode: e.target.value })} />
            </div>
            <div>
              <Label>Skills (comma-separated)</Label>
              <Input value={p.skills} onChange={(e) => setP({ ...p, skills: e.target.value })} />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea
                rows={3}
                value={p.bio}
                onChange={(e) => setP({ ...p, bio: e.target.value })}
              />
            </div>
            <Button type="submit" disabled={busy} className="rounded-xl">
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

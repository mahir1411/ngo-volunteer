import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CATEGORIES = [
  "Education",
  "Environment",
  "Healthcare",
  "Community",
  "Animal welfare",
  "Disaster relief",
  "Other",
];

export const Route = createFileRoute("/_authenticated/ngo/events/new")({
  head: () => ({ meta: [{ title: "Create event — KindLink" }] }),
  component: NewEvent,
});

function NewEvent() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<File | null>(null);
  const [roles, setRoles] = useState<Array<{ role_name: string; spots_needed: number }>>([
    { role_name: "Volunteer", spots_needed: 5 },
  ]);
  const [f, setF] = useState({
    title: "",
    description: "",
    category: "Community",
    starts_at: "",
    ends_at: "",
    address: "",
    pincode: "",
    contact_email: "",
    contact_phone: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("ngo_profiles")
      .select("contact_email, contact_phone")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data)
          setF((x) => ({
            ...x,
            contact_email: data.contact_email || "",
            contact_phone: data.contact_phone || "",
          }));
      });
  }, [user?.id]);

  const totalSpots = roles.reduce((s, r) => s + (r.spots_needed || 0), 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) {
      toast.error("Please wait for your account to finish loading.");
      return;
    }
    if (!user) {
      toast.error("You need to be signed in as an NGO to publish events.");
      return;
    }
    if (!f.title || !f.description || !f.starts_at || !f.ends_at || !f.address) {
      toast.error("Fill required fields");
      return;
    }

    // Validate roles
    for (const r of roles) {
      if (!r.role_name.trim()) {
        toast.error("Please specify a name for all roles.");
        return;
      }
      if (isNaN(r.spots_needed) || r.spots_needed < 1) {
        toast.error("Spots needed must be at least 1.");
        return;
      }
    }

    setBusy(true);

    try {
      // Safe date parser to avoid Safari/local timezone parse failures
      const parseDateTime = (val: string) => {
        const d = new Date(val);
        if (isNaN(d.getTime())) {
          const cleaned = val.replace("T", " ");
          const fallback = new Date(cleaned);
          if (isNaN(fallback.getTime())) {
            throw new Error(`Invalid date format: ${val}`);
          }
          return fallback;
        }
        return d;
      };

      const startsAtISO = parseDateTime(f.starts_at).toISOString();
      const endsAtISO = parseDateTime(f.ends_at).toISOString();

      // Geocode with a 2-second timeout fallback to prevent blocking submissions if Nominatim is rate-limited
      let lat: number | null = null,
        lng: number | null = null;
      try {
        const timeout = (ms: number) =>
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms));
        const { geocodeAddress } = await import("@/lib/geocode.functions");
        const geo = (await Promise.race([
          geocodeAddress({ data: { query: `${f.address} ${f.pincode}` } }),
          timeout(2000),
        ])) as any;
        lat = geo?.lat ?? null;
        lng = geo?.lng ?? null;
      } catch (geoErr) {
        console.warn(
          "Geocoding failed or timed out, creating event with null coordinates:",
          geoErr,
        );
      }

      const { data: ev, error } = await supabase
        .from("events")
        .insert({
          ngo_id: user.id,
          title: f.title,
          description: f.description,
          category: f.category,
          starts_at: startsAtISO,
          ends_at: endsAtISO,
          address: f.address,
          pincode: f.pincode,
          lat,
          lng,
          total_spots: totalSpots,
          contact_email: f.contact_email || null,
          contact_phone: f.contact_phone || null,
          status: "published",
        })
        .select("id")
        .single();

      if (error || !ev) {
        throw new Error(error?.message || "Failed to save event to database");
      }

      // Banner upload
      if (banner) {
        const path = `${user.id}/${ev.id}-${banner.name}`;
        const { error: upErr } = await supabase.storage
          .from("event-banners")
          .upload(path, banner, { upsert: true });
        if (!upErr) await supabase.from("events").update({ banner_url: path }).eq("id", ev.id);
      }

      // Role rows
      const roleRows = roles
        .filter((r) => r.role_name.trim())
        .map((r) => ({
          event_id: ev.id,
          role_name: r.role_name.trim(),
          spots_needed: r.spots_needed,
        }));
      if (roleRows.length) {
        const { error: rolesErr } = await supabase.from("event_roles").insert(roleRows);
        if (rolesErr) {
          throw new Error("Failed to save volunteer roles: " + rolesErr.message);
        }
      }

      setBusy(false);
      toast.success("Event published!");
      nav({ to: "/ngo/events" });
    } catch (err: any) {
      console.error("Error during event creation:", err);
      toast.error(err.message || "An unexpected error occurred during creation");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Create a new event</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div>
              <Label>Title *</Label>
              <Input
                value={f.title}
                onChange={(e) => setF({ ...f, title: e.target.value })}
                required
                maxLength={120}
              />
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea
                rows={5}
                value={f.description}
                onChange={(e) => setF({ ...f, description: e.target.value })}
                required
                maxLength={2000}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Category</Label>
                <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Banner image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBanner(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Starts at *</Label>
                <Input
                  type="datetime-local"
                  value={f.starts_at}
                  onChange={(e) => setF({ ...f, starts_at: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Ends at *</Label>
                <Input
                  type="datetime-local"
                  value={f.ends_at}
                  onChange={(e) => setF({ ...f, ends_at: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Address *</Label>
              <Input
                value={f.address}
                onChange={(e) => setF({ ...f, address: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Pincode</Label>
              <Input value={f.pincode} onChange={(e) => setF({ ...f, pincode: e.target.value })} />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Volunteer roles ({totalSpots} total spots)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRoles([...roles, { role_name: "", spots_needed: 1 }])}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add role
                </Button>
              </div>
              <div className="space-y-2">
                {roles.map((r, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="Role name (e.g. Teaching)"
                      value={r.role_name}
                      onChange={(e) => {
                        const n = [...roles];
                        n[i].role_name = e.target.value;
                        setRoles(n);
                      }}
                    />
                    <Input
                      type="number"
                      min={1}
                      className="w-24"
                      value={r.spots_needed}
                      onChange={(e) => {
                        const n = [...roles];
                        n[i].spots_needed = Number(e.target.value);
                        setRoles(n);
                      }}
                    />
                    {roles.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setRoles(roles.filter((_, j) => j !== i))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Contact email</Label>
                <Input
                  type="email"
                  value={f.contact_email}
                  onChange={(e) => setF({ ...f, contact_email: e.target.value })}
                />
              </div>
              <div>
                <Label>Contact phone</Label>
                <Input
                  value={f.contact_phone}
                  onChange={(e) => setF({ ...f, contact_phone: e.target.value })}
                />
              </div>
            </div>

            <Button type="submit" disabled={busy || loading || !user} className="w-full rounded-xl">
              {loading ? "Loading account…" : busy ? "Publishing…" : "Publish event"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

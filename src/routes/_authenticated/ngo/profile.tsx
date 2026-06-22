import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Clock, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/ngo/profile")({
  head: () => ({ meta: [{ title: "NGO profile — VolunteerConnect" }] }),
  component: NgoProfile,
});

function NgoProfile() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"pending" | "verified" | "rejected">("pending");
  const [hasCert, setHasCert] = useState(false);
  const [cert, setCert] = useState<File | null>(null);
  const [f, setF] = useState({
    org_name: "",
    description: "",
    website: "",
    registration_number: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    pincode: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("ngo_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setStatus(data.verification_status);
        setHasCert(!!data.registration_cert_url);
        setF({
          org_name: data.org_name,
          description: data.description || "",
          website: data.website || "",
          registration_number: data.registration_number || "",
          contact_email: data.contact_email || "",
          contact_phone: data.contact_phone || "",
          address: data.address || "",
          pincode: data.pincode || "",
        });
      });
  }, [user?.id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);

    let cert_path: string | null = null;
    if (cert) {
      const path = `${user.id}/registration-cert-${Date.now()}-${cert.name}`;
      const { error } = await supabase.storage
        .from("ngo-docs")
        .upload(path, cert, { upsert: true });
      if (!error) cert_path = path;
    }

    let lat: number | null = null,
      lng: number | null = null;
    try {
      const { geocodeAddress } = await import("@/lib/geocode.functions");
      const geo = await geocodeAddress({ data: { query: `${f.address} ${f.pincode}` } });
      lat = geo?.lat ?? null;
      lng = geo?.lng ?? null;
    } catch {
      /* */
    }

    const update: any = { ...f, lat, lng };
    if (cert_path) update.registration_cert_url = cert_path;
    const { error } = await supabase.from("ngo_profiles").update(update).eq("user_id", user.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Profile saved");
      if (cert_path) setHasCert(true);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-2xl">Organization profile</CardTitle>
            {status === "verified" && (
              <Badge className="rounded-full bg-primary/10 text-primary">
                <BadgeCheck className="mr-1 h-3 w-3" />
                Verified
              </Badge>
            )}
            {status === "pending" && (
              <Badge variant="outline" className="rounded-full">
                <Clock className="mr-1 h-3 w-3" />
                Verification pending
              </Badge>
            )}
            {status === "rejected" && (
              <Badge variant="destructive" className="rounded-full">
                Verification rejected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label>Organization name</Label>
              <Input
                value={f.org_name}
                onChange={(e) => setF({ ...f, org_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={4}
                value={f.description}
                onChange={(e) => setF({ ...f, description: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Website</Label>
                <Input
                  value={f.website}
                  onChange={(e) => setF({ ...f, website: e.target.value })}
                />
              </div>
              <div>
                <Label>Registration / trust number</Label>
                <Input
                  value={f.registration_number}
                  onChange={(e) => setF({ ...f, registration_number: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Contact email</Label>
                <Input
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
            <div>
              <Label>Office address</Label>
              <Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
            </div>
            <div>
              <Label>Pincode</Label>
              <Input value={f.pincode} onChange={(e) => setF({ ...f, pincode: e.target.value })} />
            </div>
            <div>
              <Label>
                {hasCert ? "Replace registration certificate" : "Upload registration certificate"}
              </Label>
              <Input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setCert(e.target.files?.[0] ?? null)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                <Upload className="mr-1 inline h-3 w-3" />
                Used only for admin verification — never shown publicly.
              </p>
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

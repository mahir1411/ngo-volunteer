import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/ngo/events/$id/edit")({
  head: () => ({ meta: [{ title: "Edit event — KindLink" }] }),
  component: EditEvent,
});

function EditEvent() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    title: "",
    description: "",
    address: "",
    pincode: "",
    starts_at: "",
    ends_at: "",
    contact_email: "",
    contact_phone: "",
  });

  useEffect(() => {
    supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setF({
          title: data.title,
          description: data.description,
          address: data.address,
          pincode: data.pincode || "",
          starts_at: data.starts_at.slice(0, 16),
          ends_at: data.ends_at.slice(0, 16),
          contact_email: data.contact_email || "",
          contact_phone: data.contact_phone || "",
        });
      });
  }, [id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    // Geocode updated address
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

    const { error } = await supabase
      .from("events")
      .update({
        title: f.title,
        description: f.description,
        address: f.address,
        pincode: f.pincode,
        lat,
        lng,
        starts_at: new Date(f.starts_at).toISOString(),
        ends_at: new Date(f.ends_at).toISOString(),
        contact_email: f.contact_email,
        contact_phone: f.contact_phone,
      })
      .eq("id", id);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Saved");
      nav({ to: "/ngo/events" });
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Edit event</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={5}
                value={f.description}
                onChange={(e) => setF({ ...f, description: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Starts at</Label>
                <Input
                  type="datetime-local"
                  value={f.starts_at}
                  onChange={(e) => setF({ ...f, starts_at: e.target.value })}
                />
              </div>
              <div>
                <Label>Ends at</Label>
                <Input
                  type="datetime-local"
                  value={f.ends_at}
                  onChange={(e) => setF({ ...f, ends_at: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
            </div>
            <div>
              <Label>Pincode</Label>
              <Input value={f.pincode} onChange={(e) => setF({ ...f, pincode: e.target.value })} />
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
            <Button type="submit" disabled={busy} className="rounded-xl">
              {busy ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

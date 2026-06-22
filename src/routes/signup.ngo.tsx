import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/signup/ngo")({
  head: () => ({
    meta: [
      { title: "NGO sign up — VolunteerConnect" },
      { name: "description", content: "Register your nonprofit on VolunteerConnect." },
    ],
  }),
  component: SignupNgo,
});

const schema = z.object({
  org_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().min(5).max(20),
  registration_number: z.string().trim().min(2).max(60),
  address: z.string().trim().min(4).max(200),
  pincode: z.string().trim().min(3).max(12),
  description: z.string().trim().max(800).optional(),
  password: z.string().min(8).max(72),
});

function SignupNgo() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [cert, setCert] = useState<File | null>(null);
  const [f, setF] = useState({
    org_name: "",
    email: "",
    phone: "",
    registration_number: "",
    address: "",
    pincode: "",
    description: "",
    password: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(f);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: f.email,
      password: f.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          role: "ngo",
          org_name: f.org_name,
          phone: f.phone,
          registration_number: f.registration_number,
        },
      },
    });
    if (error || !data.user) {
      setBusy(false);
      toast.error(error?.message || "Signup failed");
      return;
    }
    const uid = data.user.id;

    // Upload certificate if provided
    let cert_path: string | null = null;
    if (cert) {
      const path = `${uid}/registration-cert-${Date.now()}-${cert.name}`;
      const { error: upErr } = await supabase.storage
        .from("ngo-docs")
        .upload(path, cert, { upsert: true });
      if (!upErr) cert_path = path;
    }

    // Geocode address
    let lat: number | null = null,
      lng: number | null = null;
    try {
      const { geocodeAddress } = await import("@/lib/geocode.functions");
      const geo = await geocodeAddress({ data: { query: `${f.address} ${f.pincode}` } });
      lat = geo?.lat ?? null;
      lng = geo?.lng ?? null;
    } catch {
      /* ignore */
    }

    await supabase
      .from("ngo_profiles")
      .update({
        address: f.address,
        pincode: f.pincode,
        lat,
        lng,
        description: f.description || null,
        registration_cert_url: cert_path,
        contact_email: f.email,
        contact_phone: f.phone,
      })
      .eq("user_id", uid);

    await supabase.from("profiles").update({ pincode: f.pincode, lat, lng }).eq("id", uid);

    setBusy(false);
    toast.success("NGO registered! You can publish events right away.");
    nav({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Left Column - Visual Info Panel */}
      <div className="relative hidden lg:flex lg:w-3/5 flex-col justify-between p-12 overflow-hidden bg-secondary/35 border-r border-border/40 text-foreground">
        {/* Logo / Header */}
        <div className="relative z-10 flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Heart className="h-4.5 w-4.5" fill="currentColor" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-foreground">
              VolunteerConnect
            </span>
          </Link>
        </div>

        {/* Hero Message */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <h1 className="font-display text-4xl font-extrabold leading-tight text-foreground sm:text-5xl">
            Expand Your Organization's Reach.
          </h1>
          <p className="text-lg text-muted-foreground font-light leading-relaxed">
            Register your nonprofit or social enterprise today to publish volunteer opportunities,
            coordinate events, and manage applicants efficiently.
          </p>

          {/* Benefits list */}
          <ul className="space-y-4 pt-4 text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold mt-0.5">
                1
              </span>
              <span className="text-sm">
                <strong className="text-foreground">Instant Event Publishing:</strong> Post
                opportunities immediately. Verification happens concurrently.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold mt-0.5">
                2
              </span>
              <span className="text-sm">
                <strong className="text-foreground">Intelligent Matchmaking:</strong> Find
                volunteers near your location with the skills you actually need.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold mt-0.5">
                3
              </span>
              <span className="text-sm">
                <strong className="text-foreground">CRM Management:</strong> Track volunteer
                applications, verify attendance, and log impact hours seamlessly.
              </span>
            </li>
          </ul>
        </div>

        {/* Quote */}
        <div className="relative z-10 mt-auto pt-6 border-t border-border/40">
          <p className="text-sm italic text-muted-foreground">
            "VolunteerConnect transformed how we coordinate our food drives. We had 20 eager
            volunteers registered and ready within 48 hours of posting."
          </p>
          <p className="text-xs font-semibold tracking-wider uppercase mt-2 text-muted-foreground/80">
            — Clara Barton, Director at Food For All
          </p>
        </div>
      </div>

      {/* Right Column - Form Container */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-20 bg-background/50 backdrop-blur-xs lg:overflow-y-auto lg:max-h-[calc(100vh-4rem)]">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Heart className="h-5 w-5" fill="currentColor" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">VolunteerConnect</span>
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="font-display text-3xl font-bold tracking-tight">Register your NGO</h2>
            <p className="text-sm text-muted-foreground">
              Publish events immediately — verification happens in the background.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Organization name</Label>
              <Input
                value={f.org_name}
                onChange={(e) => setF({ ...f, org_name: e.target.value })}
                placeholder="e.g. Green Earth Initiative"
                required
                className="rounded-xl border-border/80 focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Official email</Label>
                <Input
                  type="email"
                  value={f.email}
                  onChange={(e) => setF({ ...f, email: e.target.value })}
                  placeholder="contact@ngo.org"
                  required
                  className="rounded-xl border-border/80 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={f.phone}
                  onChange={(e) => setF({ ...f, phone: e.target.value })}
                  placeholder="+1 (555) 012-3456"
                  required
                  className="rounded-xl border-border/80 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input
                type="password"
                value={f.password}
                onChange={(e) => setF({ ...f, password: e.target.value })}
                placeholder="Minimum 8 characters"
                required
                minLength={8}
                className="rounded-xl border-border/80 focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Registration / Trust Number</Label>
              <Input
                value={f.registration_number}
                onChange={(e) => setF({ ...f, registration_number: e.target.value })}
                placeholder="e.g. Reg-729402"
                required
                className="rounded-xl border-border/80 focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Office address</Label>
              <Input
                value={f.address}
                onChange={(e) => setF({ ...f, address: e.target.value })}
                placeholder="123 Purpose Lane, Suite 100"
                required
                className="rounded-xl border-border/80 focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pincode / Postal Code</Label>
              <Input
                value={f.pincode}
                onChange={(e) => setF({ ...f, pincode: e.target.value })}
                placeholder="e.g. 400001"
                required
                className="rounded-xl border-border/80 focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Short description</Label>
              <Textarea
                rows={3}
                placeholder="What is your organization's mission and focus?"
                value={f.description}
                onChange={(e) => setF({ ...f, description: e.target.value })}
                className="rounded-xl border-border/80 focus:ring-primary focus:border-primary resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Registration Certificate (PDF or Image)</Label>
              <Input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setCert(e.target.files?.[0] ?? null)}
                className="rounded-xl border-border/80 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Stored privately. Used for the verified badge — does not block immediate publishing.
              </p>
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl py-6 font-medium text-base shadow-xs cursor-pointer"
            >
              {busy ? "Creating account…" : "Create NGO account"}
            </Button>

            <div className="pt-4 border-t border-border/50 text-center space-y-2 text-sm text-muted-foreground">
              <p>
                Already registered?{" "}
                <Link to="/auth" className="font-medium text-primary hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

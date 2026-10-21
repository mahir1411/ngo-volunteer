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

export const Route = createFileRoute("/signup/volunteer")({
  head: () => ({
    meta: [
      { title: "Volunteer sign up — KindLink" },
      { name: "description", content: "Create a volunteer account on KindLink." },
    ],
  }),
  component: SignupVolunteer,
});

const schema = z.object({
  full_name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().min(5).max(20),
  pincode: z.string().trim().min(3).max(12),
  skills: z.string().trim().max(300),
  bio: z.string().trim().max(500).optional(),
  password: z.string().min(8).max(72),
});

function SignupVolunteer() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    full_name: "",
    email: "",
    phone: "",
    pincode: "",
    skills: "",
    bio: "",
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
        data: { role: "volunteer", full_name: f.full_name, phone: f.phone },
      },
    });
    if (error || !data.user) {
      setBusy(false);
      const msg = error?.message?.includes("Failed to fetch")
        ? "Network error: Cannot reach Supabase backend. Please check your network or ad-blocker."
        : error?.message || "Signup failed";
      toast.error(msg);
      return;
    }

    // Best-effort: enrich profile + volunteer_profile with extra fields.
    const uid = data.user.id;
    const skills = f.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Geocode the pincode in background (don't block UX)
    try {
      const { geocodeAddress } = await import("@/lib/geocode.functions");
      const geo = await geocodeAddress({ data: { query: f.pincode } });
      await supabase
        .from("profiles")
        .update({ pincode: f.pincode, lat: geo?.lat ?? null, lng: geo?.lng ?? null })
        .eq("id", uid);
    } catch {
      await supabase.from("profiles").update({ pincode: f.pincode }).eq("id", uid);
    }
    await supabase
      .from("volunteer_profiles")
      .update({ skills, bio: f.bio || null })
      .eq("user_id", uid);

    setBusy(false);
    toast.success("Account created — welcome!");
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
              KindLink
            </span>
          </Link>
        </div>

        {/* Hero Message */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <h1 className="font-display text-4xl font-extrabold leading-tight text-foreground sm:text-5xl">
            Start Your Volunteering Journey.
          </h1>
          <p className="text-lg text-muted-foreground font-light leading-relaxed">
            Create an account in minutes to discover events, connect with local non-profits, and
            track your impact hours.
          </p>

          {/* Benefits list */}
          <ul className="space-y-4 pt-4 text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold mt-0.5">
                1
              </span>
              <span className="text-sm">
                <strong className="text-foreground">Discover Local Events:</strong> Filter by
                proximity, skills, and availability.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold mt-0.5">
                2
              </span>
              <span className="text-sm">
                <strong className="text-foreground">Skill Matching:</strong> Share your expertise in
                teaching, first aid, design, or marketing.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold mt-0.5">
                3
              </span>
              <span className="text-sm">
                <strong className="text-foreground">Track Your Hours:</strong> Generate verified
                reports for schools, jobs, or personal growth.
              </span>
            </li>
          </ul>
        </div>

        {/* Quote */}
        <div className="relative z-10 mt-auto pt-6 border-t border-border/40">
          <p className="text-sm italic text-muted-foreground">
            "Volunteering has given me a sense of purpose I couldn't find anywhere else. The pincode
            search matches me with opportunities literally down the street!"
          </p>
          <p className="text-xs font-semibold tracking-wider uppercase mt-2 text-muted-foreground/80">
            — Marcus Aurelius, Active Volunteer
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
            <span className="font-display font-bold text-xl tracking-tight">KindLink</span>
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="font-display text-3xl font-bold tracking-tight">Volunteer Sign Up</h2>
            <p className="text-sm text-muted-foreground">
              Tell us a bit about yourself so we can match nearby events.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Full name</Label>
                <Input
                  value={f.full_name}
                  onChange={(e) => setF({ ...f, full_name: e.target.value })}
                  placeholder="John Doe"
                  required
                  className="rounded-xl border-border/80 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={f.phone}
                  onChange={(e) => setF({ ...f, phone: e.target.value })}
                  placeholder="+1 (555) 019-2834"
                  required
                  className="rounded-xl border-border/80 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email address</Label>
              <Input
                type="email"
                value={f.email}
                onChange={(e) => setF({ ...f, email: e.target.value })}
                placeholder="name@example.com"
                required
                className="rounded-xl border-border/80 focus:ring-primary focus:border-primary"
              />
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
              <Label>Pincode / Postal Code</Label>
              <Input
                placeholder="e.g. 400001"
                value={f.pincode}
                onChange={(e) => setF({ ...f, pincode: e.target.value })}
                required
                className="rounded-xl border-border/80 focus:ring-primary focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">
                We use this to find events within 10 km of you.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Skills (comma-separated)</Label>
              <Input
                placeholder="teaching, first-aid, photography"
                value={f.skills}
                onChange={(e) => setF({ ...f, skills: e.target.value })}
                className="rounded-xl border-border/80 focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Short bio (optional)</Label>
              <Textarea
                rows={3}
                placeholder="Tell us a little about your background or interests..."
                value={f.bio}
                onChange={(e) => setF({ ...f, bio: e.target.value })}
                className="rounded-xl border-border/80 focus:ring-primary focus:border-primary resize-none"
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl py-6 font-medium text-base shadow-xs cursor-pointer"
            >
              {busy ? "Creating account…" : "Create volunteer account"}
            </Button>

            <div className="pt-4 border-t border-border/50 text-center space-y-2 text-sm text-muted-foreground">
              <p>
                Already have an account?{" "}
                <Link to="/auth" className="font-medium text-primary hover:underline">
                  Log in
                </Link>
              </p>
              <p>
                Run an NGO instead?{" "}
                <Link to="/signup/ngo" className="font-medium text-primary hover:underline">
                  Register here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

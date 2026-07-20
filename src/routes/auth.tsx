import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Log in — KindLink" },
      { name: "description", content: "Log in to KindLink." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    nav({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Left Column - Visual Info Panel */}
      <div className="relative hidden lg:flex lg:w-3/5 flex-col justify-between p-12 overflow-hidden bg-secondary/35 border-r border-border/40 text-foreground">
        {/* Logo / Header */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <Heart className="h-4.5 w-4.5" fill="currentColor" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-foreground">
            KindLink
          </span>
        </div>

        {/* Hero Message */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <h1 className="font-display text-4xl font-extrabold leading-tight text-foreground sm:text-5xl">
            Empower Communities. Connect with Purpose.
          </h1>
          <p className="text-lg text-muted-foreground font-light leading-relaxed">
            Join thousands of volunteers and organizations working together to create real, lasting
            impact.
          </p>

          {/* Stat badges */}
          <div className="grid grid-cols-2 gap-6 pt-8 border-t border-border/40">
            <div>
              <div className="font-display text-3xl font-bold text-primary">12,450+</div>
              <div className="text-sm text-muted-foreground">Hours Volunteered</div>
            </div>
            <div>
              <div className="font-display text-3xl font-bold text-primary">450+</div>
              <div className="text-sm text-muted-foreground">Active Projects</div>
            </div>
          </div>
        </div>

        {/* Testimonial Quote */}
        <div className="relative z-10 mt-auto pt-6 border-t border-border/40">
          <blockquote className="space-y-2">
            <p className="text-sm italic text-muted-foreground">
              "KindLink made it incredibly easy to find projects in my neighborhood. I've
              met amazing people and helped plant over 100 trees!"
            </p>
            <footer className="text-xs font-semibold tracking-wider uppercase text-muted-foreground/80">
              — Sarah Chen, Local Eco-Volunteer
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right Column - Auth Form */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-20 bg-background/50 backdrop-blur-xs">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Heart className="h-5 w-5" fill="currentColor" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">KindLink</span>
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="font-display text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Log in to continue volunteering or managing events.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border-border/80 focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border-border/80 focus:ring-primary focus:border-primary"
              />
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl py-6 font-medium text-base shadow-xs cursor-pointer"
            >
              {busy ? "Signing in…" : "Sign in to account"}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            New here?{" "}
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-4">
              <Link to="/signup/volunteer" className="font-medium text-primary hover:underline">
                Sign up as volunteer
              </Link>
              <span className="hidden sm:inline text-muted-foreground/40">•</span>
              <Link to="/signup/ngo" className="font-medium text-primary hover:underline">
                Register an NGO
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

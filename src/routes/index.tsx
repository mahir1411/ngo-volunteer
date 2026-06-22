import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Heart,
  Search,
  MapPin,
  BadgeCheck,
  Users,
  Calendar,
  Sparkles,
  Trophy,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VolunteerConnect — Connect nonprofits with volunteers" },
      {
        name: "description",
        content:
          "Find volunteer events near you or post opportunities for your nonprofit. Geo-radius search, instant signup, and certificates that travel with you.",
      },
      { property: "og:title", content: "VolunteerConnect" },
      { property: "og:description", content: "Connect nonprofits with volunteers — instantly." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="overflow-hidden relative min-h-screen">
      {/* Background gradients */}
      <div className="absolute top-[10%] left-[50%] -translate-x-[50%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl -z-10" />
      <div className="absolute top-[40%] right-[10%] w-[300px] h-[300px] rounded-full bg-accent/10 blur-3xl -z-10" />

      {/* 1. Center-Aligned Hero Section */}
      <section className="relative pt-20 pb-16 text-center max-w-4xl mx-auto px-4 sm:px-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-secondary/80 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-widest mx-auto animate-fade-in">
          <Sparkles className="h-3.5 w-3.5" /> Reimagined Volunteer Portal
        </div>
        <h1 className="mt-8 font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl text-foreground">
          Connecting hands. <br />
          <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            Empowering communities.
          </span>
        </h1>
        <p className="mt-6 text-lg md:text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto">
          A high-performance geolocated matching platform connecting local NGOs with skilled
          volunteers. Sign up, track hours, and generate verified certificates instantly.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="rounded-2xl text-base px-8 py-6 bg-gradient-to-r from-primary to-primary/95 shadow-lg shadow-primary/15 hover:shadow-xl hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Link to="/signup/volunteer">Get Started as Volunteer</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-2xl text-base px-8 py-6 border-border/60 hover:bg-secondary/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Link to="/signup/ngo">Register Organization</Link>
          </Button>
        </div>
      </section>

      {/* 2. Interactive Dual Panel Mockup (Positions & Layouts Redesigned) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid gap-8 lg:grid-cols-2 items-stretch">
          {/* Volunteer Perspective Mockup */}
          <div className="rounded-[2.5rem] border border-border/40 bg-card p-6 md:p-8 shadow-xl flex flex-col justify-between hover:border-primary/20 transition-all duration-300 relative group">
            <div className="absolute top-4 right-4 text-xs font-bold text-primary/70 uppercase tracking-widest bg-secondary/80 border border-primary/5 px-3 py-1 rounded-full">
              Volunteer Hub
            </div>
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary mb-5">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="font-display text-2xl font-extrabold text-foreground/90">
                Find local events
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-md">
                Search nearby projects using adjustable radius filters, coordinates, and skills.
                Apply in a single click without messy signup forms.
              </p>
            </div>
            <div className="mt-8 space-y-3 bg-secondary/20 p-4 rounded-2xl border border-border/30">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase pb-2 border-b border-border/40">
                <span>Active Search</span>
                <span className="text-primary">Within 10 km</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-accent animate-ping" />
                <span className="text-xs font-semibold text-foreground/80">
                  Sunrise Academy · teaching helper needed (1.2 km away)
                </span>
              </div>
            </div>
          </div>

          {/* NGO Perspective Mockup */}
          <div className="rounded-[2.5rem] border border-border/40 bg-card p-6 md:p-8 shadow-xl flex flex-col justify-between hover:border-accent/20 transition-all duration-300 relative group">
            <div className="absolute top-4 right-4 text-xs font-bold text-accent/70 uppercase tracking-widest bg-accent/5 border border-accent/5 px-3 py-1 rounded-full">
              NGO Manager
            </div>
            <div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent mb-5">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-display text-2xl font-extrabold text-foreground/90">
                Coordinate applicants
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-md">
                Manage applications using a CRM-style split panel dashboard. Mark attendance and
                instantly issue digital PDF certificates.
              </p>
            </div>
            <div className="mt-8 space-y-3 bg-secondary/20 p-4 rounded-2xl border border-border/30">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase pb-2 border-b border-border/40">
                <span>Application Queue</span>
                <span className="text-accent">2 pending</span>
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground/80">
                  Rahul S. applied for Logistics Specialist (Pincode: 400001)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. High-Contrast Impact Stats Grid */}
      <section className="border-t border-b border-border/40 bg-card/30 backdrop-blur-sm py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-border/40">
            {[
              { num: "10 km", label: "Default search origin" },
              { num: "100%", label: "Direct contact coordinate" },
              { num: "Instant", label: "NGO publishing access" },
              { num: "Verified", label: "PDF certificate generation" },
            ].map((s, i) => (
              <div key={i} className={`pt-6 lg:pt-0 ${i === 0 ? "pt-0" : ""}`}>
                <div className="font-display text-4xl lg:text-5xl font-black text-primary">
                  {s.num}
                </div>
                <div className="text-sm font-semibold text-muted-foreground mt-2">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Sleek Call to Action Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20">
        <div className="relative rounded-[3rem] overflow-hidden border border-border/40 bg-gradient-to-br from-secondary/40 via-card to-secondary/30 p-8 md:p-16 text-center shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(79,70,229,0.06),transparent_40%)]" />
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl text-foreground">
            Make your time count.
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Create an account, find an opportunity near you, and log hours to earn downloadable
            certificates.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-2xl px-8 py-6 bg-primary text-primary-foreground shadow-md shadow-primary/5 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Link to="/signup/volunteer" className="flex items-center gap-2">
                I want to volunteer <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-2xl px-8 py-6 border-border/60 hover:bg-secondary/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Link to="/browse">Browse events first</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10 bg-background/50 text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>© {new Date().getFullYear()} VolunteerConnect. All rights reserved.</div>
          <div className="flex items-center gap-1.5">
            <Heart className="h-4 w-4 text-accent animate-pulse" fill="currentColor" /> Bridging
            community needs
          </div>
        </div>
      </footer>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { EventCard, type EventLite } from "@/components/EventCard";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SlidersHorizontal, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const CATEGORIES = [
  "Education",
  "Environment",
  "Healthcare",
  "Community",
  "Animal welfare",
  "Disaster relief",
  "Other",
];

export const Route = createFileRoute("/_authenticated/volunteer/search")({
  head: () => ({ meta: [{ title: "Find events near you — KindLink" }] }),
  component: VolunteerSearch,
});

function VolunteerSearch() {
  const { user } = useAuth();
  const [radius, setRadius] = useState(10);
  const [category, setCategory] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [skill, setSkill] = useState("");
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const [profile, setProfile] = useState<{
    pincode: string | null;
    lat: number | null;
    lng: number | null;
  } | null>(null);

  // Dynamic pincode input & search coordinates override
  const [pincodeInput, setPincodeInput] = useState<string>("");
  const [searchCoords, setSearchCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("pincode, lat, lng")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const p = data ?? { pincode: null, lat: null, lng: null };
        setProfile(p);
        setPincodeInput(p.pincode ?? "");
        if (p.lat && p.lng) {
          setSearchCoords({ lat: p.lat, lng: p.lng });
        }
      });
  }, [user?.id]);

  const handlePincodeSearch = async () => {
    if (!pincodeInput || pincodeInput.trim().length < 3) {
      toast.error("Please enter a valid pincode");
      return;
    }
    setIsGeocoding(true);
    try {
      const { geocodeAddress } = await import("@/lib/geocode.functions");
      const geo = await geocodeAddress({ data: { query: pincodeInput } });
      if (geo) {
        setSearchCoords({ lat: geo.lat, lng: geo.lng });
        toast.success(`Location set to ${geo.display_name.split(",")[0]}`);
      } else {
        toast.error("Could not find coordinates for this pincode");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to lookup pincode");
    } finally {
      setIsGeocoding(false);
    }
  };

  const lat = searchCoords?.lat ?? 0;
  const lng = searchCoords?.lng ?? 0;

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["search", lat, lng, radius, category, from, to, onlyOpen],
    enabled: true,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_events", {
        _lat: searchCoords?.lat ?? null,
        _lng: searchCoords?.lng ?? null,
        _radius_km: searchCoords?.lat ? radius : null,
        _category: category === "all" ? undefined : category,
        _from: from ? new Date(from).toISOString() : undefined,
        _to: to ? new Date(to).toISOString() : undefined,
        _only_open: onlyOpen,
      } as never);
      if (error) throw error;
      return (data ?? []) as EventLite[];
    },
  });

  const filtered = skill
    ? events.filter(
        (e) =>
          e.title.toLowerCase().includes(skill.toLowerCase()) ||
          (e.category || "").toLowerCase().includes(skill.toLowerCase()),
      )
    : events;

  const isPincodeModified = pincodeInput !== (profile?.pincode ?? "");

  const activeFiltersCount =
    (radius !== 10 ? 1 : 0) +
    (category !== "all" ? 1 : 0) +
    (from ? 1 : 0) +
    (to ? 1 : 0) +
    (skill ? 1 : 0) +
    (onlyOpen ? 0 : 1) +
    (isPincodeModified ? 1 : 0);

  const filtersForm = (
    <div className="space-y-6">
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <SlidersHorizontal className="h-4.5 w-4.5 text-primary" />
        <span className="font-display text-base font-bold">Search Filters</span>
        {activeFiltersCount > 0 && (
          <Badge className="ml-auto rounded-full bg-primary/10 text-primary border-none font-bold">
            {activeFiltersCount} active
          </Badge>
        )}
      </div>

      {/* Pincode Search Filter */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Location Pincode</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Enter pincode"
            value={pincodeInput}
            onChange={(e) => setPincodeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handlePincodeSearch();
              }
            }}
            className="rounded-xl border-border/60 bg-background/50 text-xs"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handlePincodeSearch}
            disabled={isGeocoding}
            className="rounded-xl px-3 cursor-pointer text-xs h-9 shrink-0 font-semibold"
          >
            {isGeocoding ? "..." : "Go"}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Press Go or Enter to filter by location radius.
        </p>
      </div>

      {/* Radius Slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-semibold">Search Distance</Label>
          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {radius} km
          </span>
        </div>
        <Slider
          min={1}
          max={50}
          step={1}
          value={[radius]}
          onValueChange={(v) => setRadius(v[0])}
          className="pt-2"
        />
        <p className="text-[10px] text-muted-foreground">
          Distance matching requires a location pincode.
        </p>
      </div>

      {/* Category Selection */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="rounded-xl border-border/60 bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Filters */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">From Date</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl border-border/60 bg-background/50 text-xs py-1"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">To Date</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-xl border-border/60 bg-background/50 text-xs py-1"
          />
        </div>
      </div>

      {/* Keyword Search */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Keywords & Skills</Label>
        <Input
          placeholder="e.g. teaching, rescue"
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          className="rounded-xl border-border/60 bg-background/50"
        />
      </div>

      {/* Only Open Switch */}
      <div className="flex items-center justify-between bg-secondary/35 border border-primary/5 px-4 py-3 rounded-2xl">
        <Label
          htmlFor="onlyOpen"
          className="cursor-pointer text-sm font-semibold text-foreground/80"
        >
          Only open spots
        </Label>
        <Switch id="onlyOpen" checked={onlyOpen} onCheckedChange={setOnlyOpen} />
      </div>

      {/* Clear Filters Button */}
      {activeFiltersCount > 0 && (
        <button
          onClick={() => {
            setRadius(10);
            setCategory("all");
            setFrom("");
            setTo("");
            setSkill("");
            setOnlyOpen(true);
            setPincodeInput(profile?.pincode ?? "");
            if (profile?.lat && profile?.lng) {
              setSearchCoords({ lat: profile.lat, lng: profile.lng });
            } else {
              setSearchCoords(null);
            }
          }}
          className="w-full text-center text-xs font-semibold text-muted-foreground hover:text-primary transition-colors py-1 cursor-pointer"
        >
          Reset all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-background">
      {/* 1. Left Sticky Sidebar - Desktop Filters */}
      <div className="hidden lg:flex lg:flex-col lg:w-1/4 xl:w-1/5 shrink-0 border-r border-border/40 bg-card/45 backdrop-blur-md p-6 space-y-6 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto">
        {filtersForm}
      </div>

      {/* Mobile filter accordion / panel header */}
      <div className="lg:hidden p-4 border-b border-border/40 bg-card/25 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Discover Events</h1>
            <div className="mt-1 text-xs text-muted-foreground">
              {searchCoords ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary animate-bounce" /> Near{" "}
                  {pincodeInput || profile?.pincode}
                </span>
              ) : (
                <span className="text-destructive font-semibold">No location set</span>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="rounded-xl flex items-center gap-1.5 text-xs h-9 cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="ml-0.5 h-4 px-1 min-w-4 rounded-full bg-primary text-primary-foreground border-none text-[9px] flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Collapsible Mobile Filters */}
        {showFiltersMobile && (
          <div className="p-4 bg-card/75 rounded-2xl border border-border/40 shadow-xs animate-in slide-in-from-top duration-200">
            {filtersForm}
          </div>
        )}
      </div>

      {/* 2. Main Event List Feed Column */}
      <div className="flex-1 flex flex-col lg:overflow-y-auto lg:h-full p-4 sm:p-6 bg-background">
        {/* Desktop Search Header */}
        <div className="hidden lg:flex items-center justify-between mb-6 shrink-0">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">
              Discover volunteer events
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {searchCoords ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary animate-bounce" /> Searching within{" "}
                  {radius}km of {pincodeInput || profile?.pincode}
                </span>
              ) : (
                <span className="text-destructive font-medium">
                  No location set.{" "}
                  <Link to="/volunteer/profile" className="underline font-bold">
                    Set pincode
                  </Link>
                </span>
              )}
            </p>
          </div>
          <div className="text-xs text-muted-foreground font-semibold bg-secondary/85 px-2.5 py-1 rounded-full border border-primary/5">
            {filtered.length} listings
          </div>
        </div>

        {/* Event List Feed */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-24 text-sm text-muted-foreground font-medium animate-pulse">
            Loading events near you…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center border border-dashed border-border/60 rounded-[2.5rem] bg-card/10 px-6">
            <span className="text-4xl">🔍</span>
            <h3 className="font-display text-lg font-bold mt-4">No opportunities found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              No volunteer opportunities match your active filters. Try widening the search radius
              or resetting filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 pb-16 animate-fade-in">
            {filtered.map((e) => (
              <EventCard key={e.id} ev={e} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

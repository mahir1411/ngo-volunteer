import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin, Users, BadgeCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { signedUrl } from "@/lib/storage-url";
import { format } from "date-fns";

export interface EventLite {
  id: string;
  title: string;
  category: string;
  banner_url: string | null;
  starts_at: string;
  address: string;
  total_spots: number;
  spots_filled?: number;
  distance_km?: number | null;
  org_name?: string | null;
  verification_status?: "pending" | "verified" | "rejected" | null;
}

export function EventCard({ ev }: { ev: EventLite }) {
  const [banner, setBanner] = useState<string | null>(null);
  useEffect(() => {
    signedUrl("event-banners", ev.banner_url).then(setBanner);
  }, [ev.banner_url]);

  const remaining = Math.max((ev.total_spots ?? 0) - (ev.spots_filled ?? 0), 0);

  return (
    <Link
      to="/events/$id"
      params={{ id: ev.id }}
      className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-border/40 bg-card shadow-sm hover:shadow-lg transition-all duration-300 card-hover-effect"
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-muted relative">
        {banner ? (
          <img
            src={banner}
            alt={ev.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-primary/10 via-primary/5 to-accent/10 font-display text-3xl font-extrabold text-primary/40">
            {ev.title.charAt(0)}
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <Badge className="rounded-full bg-background/95 text-foreground backdrop-blur border-none px-3 py-1 text-[11px] font-bold shadow-sm">
            {ev.category}
          </Badge>
          {ev.verification_status === "verified" && (
            <Badge className="rounded-full bg-primary text-primary-foreground border-none px-3 py-1 text-[11px] font-bold shadow-sm">
              <BadgeCheck className="mr-1 h-3.5 w-3.5 inline-block align-text-bottom" />
              Verified Org
            </Badge>
          )}
        </div>
        {typeof ev.distance_km === "number" && (
          <div className="absolute bottom-3 right-3 rounded-full bg-background/90 text-primary backdrop-blur px-2.5 py-0.5 text-[11px] font-bold shadow-sm">
            {ev.distance_km.toFixed(1)} km away
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-lg font-bold leading-snug text-foreground/90 group-hover:text-primary transition-colors line-clamp-2">
          {ev.title}
        </h3>
        {ev.org_name && (
          <div className="text-xs font-semibold text-muted-foreground/80 tracking-wide uppercase">
            {ev.org_name}
          </div>
        )}

        <div className="mt-auto space-y-2 pt-4 border-t border-border/30 text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary/70" />
            <span>{format(new Date(ev.starts_at), "MMM d, yyyy · p")}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary/70" />
            <span className="line-clamp-1">{ev.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary/70" />
            <span
              className={
                remaining === 0
                  ? "text-destructive"
                  : remaining <= 2
                    ? "text-accent font-bold"
                    : "text-foreground/80"
              }
            >
              {remaining === 0
                ? "No spots open"
                : `${remaining} spot${remaining === 1 ? "" : "s"} remaining`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

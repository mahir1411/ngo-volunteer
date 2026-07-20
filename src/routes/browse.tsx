import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EventCard, type EventLite } from "@/components/EventCard";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse volunteer events — KindLink" },
      { name: "description", content: "Explore upcoming NGO events looking for volunteers." },
    ],
  }),
  component: Browse,
});

function Browse() {
  const { data, isLoading } = useQuery({
    queryKey: ["browse-events"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_events", {
        _lat: 0,
        _lng: 0,
        _radius_km: 99999,
      } as never);
      if (error) throw error;
      return (data ?? []) as EventLite[];
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Browse volunteer events
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Public preview.{" "}
            <a href="/signup/volunteer" className="font-medium text-primary hover:underline">
              Sign up
            </a>{" "}
            to filter by distance & skills.
          </p>
        </div>
      </div>
      {isLoading && (
        <div className="mt-10 text-center text-sm text-muted-foreground">Loading events…</div>
      )}
      {!isLoading && data && data.length === 0 && (
        <div className="mt-16 rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No events yet. Check back soon.
        </div>
      )}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((e) => (
          <EventCard key={e.id} ev={e} />
        ))}
      </div>
    </div>
  );
}

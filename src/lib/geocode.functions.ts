import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({ query: z.string().trim().min(3).max(200) });

export interface GeocodeResult {
  lat: number;
  lng: number;
  display_name: string;
}

/** Server-side proxy to Nominatim. Respects their UA policy. */
export const geocodeAddress = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<GeocodeResult | null> => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(data.query)}`;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "VolunteerConnect/1.0 (volunteer-portal)",
          "Accept-Language": "en",
        },
      });
      if (!res.ok) return null;
      const arr = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
      if (!arr.length) return null;
      return {
        lat: parseFloat(arr[0].lat),
        lng: parseFloat(arr[0].lon),
        display_name: arr[0].display_name,
      };
    } catch {
      return null;
    }
  });

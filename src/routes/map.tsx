import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtCurrency, fmtAddress } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/map")({
  component: MapPage,
});

type MapFilter = "all" | "hot" | "tax" | "absentee";

const FILTERS: { id: MapFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "hot", label: "Hot 8+" },
  { id: "tax", label: "Tax delinq" },
  { id: "absentee", label: "Absentee" },
];

function MapPage() {
  const [filter, setFilter] = useState<MapFilter>("all");

  const leads = useQuery({
    queryKey: ["map-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select(
          "id,latitude,longitude,owner_name,owner_type,motivation_score,property_address_line1,property_city,property_state,estimated_equity,tax_delinquent,is_absentee",
        )
        .not("latitude", "is", null)
        .not("longitude", "is", null);
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = (leads.data || []).filter((l) => {
    if (filter === "hot") return Number(l.motivation_score ?? 0) >= 8;
    if (filter === "tax") return l.tax_delinquent === true;
    if (filter === "absentee") return l.is_absentee === true;
    return true;
  });

  // Default center: Chattanooga (we serve TN/GA primarily)
  let centerLat = 35.0456;
  let centerLng = -85.3097;
  if (filtered.length) {
    centerLat = filtered.reduce((s, l) => s + Number(l.latitude), 0) / filtered.length;
    centerLng = filtered.reduce((s, l) => s + Number(l.longitude), 0) / filtered.length;
  }

  return (
    <main className="pb-24">
      <header className="px-4 pt-6">
        <h1 className="mb-3 text-2xl font-bold">Map</h1>
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/50",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-4 overflow-hidden rounded-2xl border border-border shadow-sm">
        <FullMap
          center={[centerLat, centerLng]}
          leads={filtered.map((l) => ({
            id: l.id,
            lat: Number(l.latitude),
            lng: Number(l.longitude),
            owner: l.owner_name,
            score: Number(l.motivation_score ?? 0),
            addr: fmtAddress([l.property_address_line1, l.property_city, l.property_state]),
            equity: l.estimated_equity,
            tax: l.tax_delinquent,
            absentee: l.is_absentee,
          }))}
        />
      </div>

      {!leads.isLoading && filtered.length === 0 ? (
        <div className="mt-4 px-4 text-center text-sm text-muted-foreground">
          No leads with coordinates match these filters.
        </div>
      ) : null}
    </main>
  );
}

function pinColor(score: number): string {
  if (score >= 8) return "#ef4444"; // red
  if (score >= 6) return "#f59e0b"; // amber
  if (score >= 4) return "#facc15"; // yellow
  return "#9ca3af"; // gray
}

function FullMap({
  center,
  leads,
}: {
  center: [number, number];
  leads: Array<{
    id: string;
    lat: number;
    lng: number;
    owner: string | null;
    score: number;
    addr: string;
    equity: number | null;
    tax: boolean | null;
    absentee: boolean | null;
  }>;
}) {
  if (typeof window === "undefined") return null;
  const RL = require("react-leaflet") as typeof import("react-leaflet");
  const L = require("leaflet") as typeof import("leaflet");

  return (
    <RL.MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom={true}
      className="h-[60vh] w-full"
      style={{ height: "60vh", width: "100%" }}
    >
      <RL.TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {leads.map((l) => {
        const color = pinColor(l.score);
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:${color};width:18px;height:18px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,0.4);"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        return (
          <RL.Marker key={l.id} position={[l.lat, l.lng]} icon={icon}>
            <RL.Popup>
              <div className="text-sm">
                <div className="font-bold">{l.owner || "Unknown"}</div>
                <div className="text-xs text-gray-600">{l.addr}</div>
                <div className="mt-1">
                  <span
                    style={{ background: color }}
                    className="inline-block rounded px-1.5 py-0.5 text-xs font-bold text-white"
                  >
                    {l.score}/10
                  </span>
                  {l.equity ? (
                    <span className="ml-2 text-xs">{fmtCurrency(l.equity, { short: true })}</span>
                  ) : null}
                </div>
                <Link
                  to="/leads/$id"
                  params={{ id: l.id }}
                  className="mt-1 block text-xs font-medium text-blue-600 underline"
                >
                  View details →
                </Link>
              </div>
            </RL.Popup>
          </RL.Marker>
        );
      })}
    </RL.MapContainer>
  );
}

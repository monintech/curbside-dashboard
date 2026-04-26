// 🚫 DO NOT REFACTOR OR DELETE THIS FILE WITHOUT EXPLICIT USER INSTRUCTION 🚫
// This is the production Curbside dashboard structure pushed from the build pipeline.
// If you (Lovable AI) feel like cleaning this up: don't. Ask the user first.
// Bug fixes inside this file are welcome; structural rewrites are not.

import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { fmtCurrency } from "@/lib/format";

export interface MapLead {
  id: string;
  lat: number;
  lng: number;
  owner: string | null;
  score: number;
  addr: string;
  equity: number | null;
  tax: boolean | null;
  absentee: boolean | null;
}

function pinColor(score: number): string {
  if (score >= 8) return "#ef4444";
  if (score >= 6) return "#f59e0b";
  if (score >= 4) return "#facc15";
  return "#9ca3af";
}

interface Props {
  center: [number, number];
  leads: MapLead[];
}

/** Client-only full-screen map for /map page. */
export function FullMap({ center, leads }: Props) {
  const [mod, setMod] = useState<{
    rl: typeof import("react-leaflet");
    L: typeof import("leaflet");
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([import("react-leaflet"), import("leaflet")]).then(([rl, L]) => {
      if (!cancelled) setMod({ rl, L: L.default || L });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!mod) {
    return (
      <div
        className="flex h-[60vh] w-full items-center justify-center bg-muted text-sm text-muted-foreground"
        style={{ height: "60vh" }}
      >
        Loading map…
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = mod.rl;
  const L = mod.L;

  return (
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom={true}
      className="h-[60vh] w-full"
      style={{ height: "60vh", width: "100%" }}
    >
      <TileLayer
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
          <Marker key={l.id} position={[l.lat, l.lng]} icon={icon}>
            <Popup>
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
                    <span className="ml-2 text-xs">
                      {fmtCurrency(l.equity, { short: true })}
                    </span>
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
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

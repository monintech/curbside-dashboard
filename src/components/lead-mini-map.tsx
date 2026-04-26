import { useEffect, useState } from "react";

interface Props {
  lat: number;
  lng: number;
}

/** Client-only mini map for the lead detail page. SSR-safe via dynamic import. */
export function LeadMiniMap({ lat, lng }: Props) {
  const [mod, setMod] = useState<{
    rl: typeof import("react-leaflet");
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([import("react-leaflet"), import("leaflet")]).then(([rl]) => {
      if (!cancelled) setMod({ rl });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!mod) {
    return (
      <div
        className="flex h-56 w-full items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground"
        style={{ height: 224 }}
      >
        Loading map…
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = mod.rl;
  return (
    <div className="overflow-hidden rounded-xl">
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        scrollWheelZoom={false}
        className="h-56 w-full"
        style={{ height: 224, width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <Marker position={[lat, lng]}>
          <Popup>
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

// 🚫 DO NOT REFACTOR OR DELETE THIS FILE WITHOUT EXPLICIT USER INSTRUCTION 🚫
// This is the production Curbside dashboard structure pushed from the build pipeline.
// If you (Lovable AI) feel like cleaning this up: don't. Ask the user first.
// Bug fixes inside this file are welcome; structural rewrites are not.

interface Props {
  lat: number;
  lng: number;
}

/** Lead detail mini-map. Uses OSM embed iframe (no JS leaflet) to dodge
 * React 19 strict-mode "Map container is already initialized" issues. */
export function LeadMiniMap({ lat, lng }: Props) {
  const delta = 0.005;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  const fullMapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <iframe
        title="Lead location"
        src={embedUrl}
        className="h-56 w-full"
        style={{ height: 224, border: 0 }}
        loading="lazy"
      />
      <div className="flex items-center justify-between bg-muted px-3 py-1.5 text-xs">
        <a href={fullMapUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          View larger ↗
        </a>
        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          Open in Google Maps ↗
        </a>
      </div>
    </div>
  );
}

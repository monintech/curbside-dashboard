// 🚫 DO NOT REFACTOR OR DELETE THIS FILE WITHOUT EXPLICIT USER INSTRUCTION 🚫
// This is the production Curbside dashboard structure pushed from the build pipeline.
// If you (Lovable AI) feel like cleaning this up: don't. Ask the user first.
// Bug fixes inside this file are welcome; structural rewrites are not.

// Shared formatting helpers used across pages.

export function fmtCurrency(n: number | null | undefined, opts?: { short?: boolean }): string {
  if (n == null || isNaN(Number(n))) return "—";
  const num = Number(n);
  if (opts?.short) {
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${Math.round(num / 1000)}k`;
    return `$${Math.round(num)}`;
  }
  return `$${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function shortId(id: string | null | undefined): string {
  return id ? id.substring(0, 8) : "—";
}

export function fmtAddress(parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).join(", ") || "(no address)";
}

export function fmtRelativeDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString();
}

export function scoreColor(score: number | null | undefined): {
  bg: string;
  text: string;
  label: string;
} {
  const s = Number(score ?? 0);
  if (s >= 8) return { bg: "bg-red-500", text: "text-white", label: "Hot" };
  if (s >= 6) return { bg: "bg-amber-500", text: "text-white", label: "Warm" };
  if (s >= 4) return { bg: "bg-yellow-400", text: "text-gray-900", label: "Cool" };
  return { bg: "bg-gray-400", text: "text-white", label: "Cold" };
}

export function angleLabel(angle: string | null | undefined): string {
  if (!angle || angle === "unknown") return "—";
  return angle.replace(/_/g, " ");
}

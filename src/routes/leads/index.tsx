// 🚫 DO NOT REFACTOR OR DELETE THIS FILE WITHOUT EXPLICIT USER INSTRUCTION 🚫
// This is the production Curbside dashboard structure pushed from the build pipeline.
// If you (Lovable AI) feel like cleaning this up: don't. Ask the user first.
// Bug fixes inside this file are welcome; structural rewrites are not.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Lead } from "@/integrations/supabase/types";
import { ScoreBadge } from "@/components/score-badge";
import { fmtCurrency, fmtAddress } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leads/")({
  component: LeadsListPage,
});

type FilterChip = "all" | "hot" | "tax" | "absentee" | "week";
type SortKey = "score" | "newest" | "oldest" | "equity";

const CHIPS: { id: FilterChip; label: string }[] = [
  { id: "all", label: "All" },
  { id: "hot", label: "Hot 8+" },
  { id: "tax", label: "Tax delinq" },
  { id: "absentee", label: "Absentee" },
  { id: "week", label: "This week" },
];

function LeadsListPage() {
  const [filter, setFilter] = useState<FilterChip>("all");
  const [sort, setSort] = useState<SortKey>("score");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["leads-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select(
          "id,photo_url,property_address_line1,property_city,property_state,property_zip,owner_name,owner_type,motivation_score,estimated_equity,tax_delinquent,is_absentee,status,captured_at,years_behind"
        )
        .order("captured_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as Lead[];
    },
  });

  // Phone counts per lead (denormalized, separate query)
  const phoneCounts = useQuery({
    queryKey: ["leads-phone-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("owner_contacts")
        .select("lead_id,is_dialable,contact_type")
        .eq("contact_type", "phone");
      if (error) throw error;
      const map = new Map<string, { total: number; dialable: number }>();
      for (const c of data || []) {
        const cur = map.get(c.lead_id) || { total: 0, dialable: 0 };
        cur.total += 1;
        if (c.is_dialable) cur.dialable += 1;
        map.set(c.lead_id, cur);
      }
      return map;
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = data;
    if (filter === "hot") rows = rows.filter((l) => Number(l.motivation_score ?? 0) >= 8);
    if (filter === "tax") rows = rows.filter((l) => l.tax_delinquent === true);
    if (filter === "absentee") rows = rows.filter((l) => l.is_absentee === true);
    if (filter === "week") {
      const cut = Date.now() - 7 * 24 * 60 * 60 * 1000;
      rows = rows.filter((l) => l.captured_at && new Date(l.captured_at).getTime() >= cut);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (l) =>
          (l.owner_name || "").toLowerCase().includes(q) ||
          (l.property_address_line1 || "").toLowerCase().includes(q) ||
          (l.property_city || "").toLowerCase().includes(q),
      );
    }
    const sorted = [...rows];
    if (sort === "score") sorted.sort((a, b) => Number(b.motivation_score ?? -1) - Number(a.motivation_score ?? -1));
    if (sort === "newest") sorted.sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime());
    if (sort === "oldest") sorted.sort((a, b) => new Date(a.captured_at).getTime() - new Date(b.captured_at).getTime());
    if (sort === "equity") sorted.sort((a, b) => Number(b.estimated_equity ?? -1) - Number(a.estimated_equity ?? -1));
    return sorted;
  }, [data, filter, sort, search]);

  return (
    <main className="px-4 pt-6">
      <h1 className="mb-4 text-2xl font-bold">Leads</h1>

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search address or owner…"
          className="w-full rounded-full border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
        />
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {CHIPS.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === c.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/50",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{isLoading ? "Loading…" : `${filtered.length} leads`}</span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-md border border-border bg-card px-2 py-1 text-xs"
        >
          <option value="score">Score</option>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="equity">Equity</option>
        </select>
      </div>

      <ul className="space-y-2 pb-24">
        {filtered.map((l) => {
          const phones = phoneCounts.data?.get(l.id);
          return (
            <li key={l.id}>
              <Link
                to="/leads/$id"
                params={{ id: l.id }}
                className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition-colors hover:bg-accent"
              >
                {l.photo_url ? (
                  <img
                    src={l.photo_url}
                    alt=""
                    className="h-[72px] w-[72px] flex-shrink-0 rounded-xl object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
                    🏠
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {l.property_address_line1 || "(no address)"}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {fmtAddress([l.property_city, l.property_state, l.property_zip])}
                      </div>
                    </div>
                    <ScoreBadge score={l.motivation_score} size="sm" />
                  </div>
                  <div className="mt-1 truncate text-xs">
                    <span className="font-medium">{l.owner_name || "Unknown"}</span>
                    {l.owner_type ? (
                      <span className="ml-1 rounded bg-muted px-1 py-0.5 text-[10px] uppercase text-muted-foreground">
                        {l.owner_type}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                    {l.estimated_equity ? (
                      <span className="text-emerald-600">💰 {fmtCurrency(l.estimated_equity, { short: true })}</span>
                    ) : null}
                    {l.tax_delinquent ? (
                      <span className="text-amber-600">⚠️ tax{l.years_behind ? ` ${l.years_behind}y` : ""}</span>
                    ) : null}
                    {l.is_absentee ? <span className="text-blue-600">🏚 absentee</span> : null}
                    {phones ? (
                      <span className="text-muted-foreground">
                        📞 {phones.total} ({phones.dialable} dialable)
                      </span>
                    ) : null}
                    <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                      {l.status}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
        {!isLoading && filtered.length === 0 ? (
          <li className="py-8 text-center text-sm text-muted-foreground">
            No leads match these filters.
          </li>
        ) : null}
      </ul>
    </main>
  );
}

// 🚫 DO NOT REFACTOR OR DELETE THIS FILE WITHOUT EXPLICIT USER INSTRUCTION 🚫
// This is the production Curbside dashboard structure pushed from the build pipeline.
// If you (Lovable AI) feel like cleaning this up: don't. Ask the user first.
// Bug fixes inside this file are welcome; structural rewrites are not.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScoreBadge } from "@/components/score-badge";
import { fmtCurrency, fmtAddress, fmtRelativeDate, shortId } from "@/lib/format";

const TELEGRAM_URL =
  import.meta.env.VITE_TELEGRAM_BOT_URL || "https://t.me/fliplens_bot";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const counters = useQuery({
    queryKey: ["home-counters"],
    queryFn: async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const dayAgo7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const counts = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("captured_at", startOfDay),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("captured_at", dayAgo7),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("captured_at", monthStart),
      ]);
      return {
        today: counts[0].count ?? 0,
        week: counts[1].count ?? 0,
        month: counts[2].count ?? 0,
      };
    },
  });

  const hot = useQuery({
    queryKey: ["home-hot-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("id,photo_url,property_address_line1,property_city,property_state,owner_name,owner_type,motivation_score,estimated_equity,tax_delinquent,is_absentee,status")
        .not("status", "in", "(\"dead\",\"not_interested\",\"closed\")")
        .order("motivation_score", { ascending: false, nullsFirst: false })
        .order("captured_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
  });

  const activity = useQuery({
    queryKey: ["home-activity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("id,event_type,event_data,created_at,lead_id")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <main className="px-4 pt-6">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Curbside</h1>
          <p className="text-xs text-muted-foreground">Driving for dollars</p>
        </div>
      </header>

      {/* Counters */}
      <section className="mb-6 grid grid-cols-3 gap-3">
        <CounterCard label="Today" value={counters.data?.today} loading={counters.isLoading} />
        <CounterCard label="Week" value={counters.data?.week} loading={counters.isLoading} />
        <CounterCard label="Month" value={counters.data?.month} loading={counters.isLoading} />
      </section>

      {/* Hot leads */}
      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">🔥 Hot Leads</h2>
          <Link to="/leads" className="text-xs font-medium text-primary">View all</Link>
        </div>
        {hot.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : !hot.data?.length ? (
          <EmptyState />
        ) : (
          <ul className="space-y-2">
            {hot.data.map((l) => (
              <li key={l.id}>
                <Link
                  to="/leads/$id"
                  params={{ id: l.id }}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition-colors hover:bg-accent"
                >
                  <Thumb url={l.photo_url} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {l.owner_name || "Unknown owner"}
                      {l.owner_type ? <span className="ml-1 text-xs font-normal text-muted-foreground">({l.owner_type})</span> : null}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {fmtAddress([l.property_address_line1, l.property_city, l.property_state])}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs">
                      {l.estimated_equity ? (
                        <span className="text-emerald-600">{fmtCurrency(l.estimated_equity, { short: true })} equity</span>
                      ) : null}
                      {l.tax_delinquent ? <span className="text-amber-600">⚠️ tax</span> : null}
                      {l.is_absentee ? <span className="text-blue-600">🏚 absentee</span> : null}
                    </div>
                  </div>
                  <ScoreBadge score={l.motivation_score} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Recent activity */}
      <section className="mb-24">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent Activity
        </h2>
        {activity.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : !activity.data?.length ? (
          <div className="text-sm text-muted-foreground">No activity yet.</div>
        ) : (
          <ul className="space-y-2 text-sm">
            {activity.data.map((a) => (
              <li
                key={a.id}
                className="flex items-baseline justify-between rounded-lg border border-border bg-card px-3 py-2"
              >
                <span className="font-medium capitalize">
                  {a.event_type.replace(/_/g, " ")}
                  {a.lead_id ? (
                    <Link
                      to="/leads/$id"
                      params={{ id: a.lead_id }}
                      className="ml-1.5 font-mono text-xs text-primary"
                    >
                      #{shortId(a.lead_id)}
                    </Link>
                  ) : null}
                </span>
                <span className="text-xs text-muted-foreground">
                  {fmtRelativeDate(a.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Floating CTA */}
      <a
        href={TELEGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-4 inline-flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105"
      >
        <Send className="h-4 w-4" />
        Start Drive
      </a>
    </main>
  );
}

function CounterCard({ label, value, loading }: { label: string; value: number | undefined; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center shadow-sm">
      <div className="text-2xl font-bold tabular-nums">{loading ? "—" : value ?? 0}</div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function Thumb({ url }: { url: string | null }) {
  if (!url) {
    return <div className="h-12 w-12 flex-shrink-0 rounded-lg bg-muted" />;
  }
  return (
    <img
      src={url}
      alt=""
      className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
      loading="lazy"
    />
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
      <div className="text-3xl">📷</div>
      <div className="mt-2 text-sm font-medium">No leads yet</div>
      <div className="mt-1 text-xs text-muted-foreground">
        Send a property photo to{" "}
        <a href={TELEGRAM_URL} className="text-primary underline" target="_blank" rel="noopener noreferrer">
          @fliplens_bot
        </a>{" "}
        to capture your first lead.
      </div>
    </div>
  );
}

// 🚫 DO NOT REFACTOR OR DELETE THIS FILE WITHOUT EXPLICIT USER INSTRUCTION 🚫
// This is the production Curbside dashboard structure pushed from the build pipeline.
// If you (Lovable AI) feel like cleaning this up: don't. Ask the user first.
// Bug fixes inside this file are welcome; structural rewrites are not.

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Org } from "@/integrations/supabase/types";

const TELEGRAM_URL =
  import.meta.env.VITE_TELEGRAM_BOT_URL || "https://t.me/fliplens_bot";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const org = useQuery({
    queryKey: ["org-default"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orgs")
        .select("*")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .maybeSingle();
      if (error) throw error;
      return data as Org | null;
    },
  });

  return (
    <main className="px-4 pt-6 pb-24">
      <h1 className="mb-4 text-2xl font-bold">Settings</h1>

      <Section title="Organization">
        {org.isLoading ? (
          <Loading />
        ) : !org.data ? (
          <Empty text="No org found." />
        ) : (
          <>
            <Row label="Name" value={org.data.name} />
            <Row label="From address" value={org.data.from_address_line1} />
            <Row
              label="From city/state/zip"
              value={[org.data.from_city, org.data.from_state, org.data.from_zip].filter(Boolean).join(", ") || "—"}
            />
            <Row label="Callback phone" value={org.data.callback_phone} />
          </>
        )}
        <p className="mt-2 text-xs text-muted-foreground">Read-only in v1. Editable in v3 multi-tenant.</p>
      </Section>

      <Section title="Capture bot">
        <a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Open @fliplens_bot in Telegram
          <ExternalLink className="h-4 w-4" />
        </a>
        <p className="mt-2 text-xs text-muted-foreground">
          Send a 📷 property photo + 📍 location pin (or just type the address) → enriched lead in ~60 seconds.
        </p>
      </Section>

      <Section title="Provider health">
        <p className="text-xs text-muted-foreground">
          The morning briefing checks Tracerfy / BatchData / Anthropic / Google Maps every day at 7am ET and DMs the operator.
          Live status not surfaced here in v1.
        </p>
      </Section>

      <p className="mt-8 text-center text-xs text-muted-foreground">Curbside v1.0</p>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-3 py-0.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || "—"}</span>
    </div>
  );
}

function Loading() {
  return <div className="text-sm text-muted-foreground">Loading…</div>;
}

function Empty({ text }: { text: string }) {
  return <div className="text-sm text-muted-foreground">{text}</div>;
}

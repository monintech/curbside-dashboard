// 🚫 DO NOT REFACTOR OR DELETE THIS FILE WITHOUT EXPLICIT USER INSTRUCTION 🚫
// This is the production Curbside dashboard structure pushed from the build pipeline.
// If you (Lovable AI) feel like cleaning this up: don't. Ask the user first.
// Bug fixes inside this file are welcome; structural rewrites are not.

import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Lead, OwnerContact, AuditLogEntry, EnrichmentJob, TaxHistoryEntry, LienEntry } from "@/integrations/supabase/types";
import { ScoreBadge } from "@/components/score-badge";
import { LeadMiniMap } from "@/components/lead-mini-map";
import { fmtCurrency, fmtAddress, angleLabel, fmtRelativeDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leads/$id")({
  component: LeadDetailPage,
});

function LeadDetailPage() {
  const { id } = useParams({ from: "/leads/$id" });

  const lead = useQuery({
    queryKey: ["lead", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as Lead | null;
    },
  });

  const contacts = useQuery({
    queryKey: ["lead-contacts", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("owner_contacts")
        .select("*")
        .eq("lead_id", id)
        .order("is_dialable", { ascending: false })
        .order("confidence_score", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data || []) as OwnerContact[];
    },
  });

  const enrichment = useQuery({
    queryKey: ["lead-enrichment", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrichment_jobs")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as EnrichmentJob[];
    },
  });

  const audit = useQuery({
    queryKey: ["lead-audit", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as AuditLogEntry[];
    },
  });

  if (lead.isLoading) {
    return <main className="p-4 text-sm text-muted-foreground">Loading…</main>;
  }
  if (!lead.data) {
    return (
      <main className="p-4">
        <Link to="/leads" className="mb-3 inline-flex items-center gap-1 text-sm text-primary">
          <ChevronLeft className="h-4 w-4" /> Back to leads
        </Link>
        <p className="text-sm text-muted-foreground">Lead not found.</p>
      </main>
    );
  }

  const l = lead.data;
  const sameMail =
    l.mailing_address_line1 &&
    l.property_address_line1 &&
    l.mailing_address_line1.trim().toLowerCase() === l.property_address_line1.trim().toLowerCase();

  return (
    <main className="pb-24">
      {/* Hero photo */}
      {l.photo_url ? (
        <img src={l.photo_url} alt="" className="h-64 w-full object-cover" />
      ) : (
        <div className="flex h-64 items-center justify-center bg-muted text-6xl">🏠</div>
      )}

      <div className="px-4 pt-4">
        <Link to="/leads" className="mb-3 inline-flex items-center gap-1 text-xs text-primary">
          <ChevronLeft className="h-4 w-4" /> Leads
        </Link>

        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{l.property_address_line1 || "(no address)"}</h1>
            <p className="text-sm text-muted-foreground">
              {fmtAddress([l.property_city, l.property_state, l.property_zip])}
            </p>
          </div>
          <ScoreBadge score={l.motivation_score} size="lg" />
        </div>

        {l.ai_notes ? (
          <Card title="AI Analysis">
            <p className="text-sm leading-relaxed">{l.ai_notes}</p>
            {l.suggested_angle && l.suggested_angle !== "unknown" ? (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                🎯 {angleLabel(l.suggested_angle)}
              </div>
            ) : null}
          </Card>
        ) : null}

        {/* Map */}
        {l.latitude != null && l.longitude != null ? (
          <Card title="Location">
            <LeadMiniMap lat={Number(l.latitude)} lng={Number(l.longitude)} />
          </Card>
        ) : null}

        <Card title="Owner">
          <Row label="Name" value={l.owner_name} />
          <Row label="Type" value={l.owner_type ? String(l.owner_type).toUpperCase() : null} />
          <Row label="Mailing address" value={fmtAddress([l.mailing_address_line1, l.mailing_city, l.mailing_state, l.mailing_zip])} />
          {l.is_absentee ? (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              🏚 Absentee — mailing differs from property
            </span>
          ) : sameMail ? (
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              ✓ Owner-occupied
            </span>
          ) : null}
        </Card>

        <Card title="Property facts">
          <Row label="Years owned" value={l.years_owned ? `${l.years_owned}` : null} />
          <Row label="Estimated value" value={fmtCurrency(l.estimated_value)} />
          <Row label="Equity" value={fmtCurrency(l.estimated_equity)} />
          <Row label="Mortgage" value={l.has_mortgage === false ? "Free & clear" : fmtCurrency(l.mortgage_balance)} />
          <Row
            label="Last sale"
            value={l.last_sale_date ? `${l.last_sale_date}${l.last_sale_price ? " · " + fmtCurrency(l.last_sale_price) : ""}` : null}
          />
          {l.parcel_id ? <Row label="Parcel ID" value={l.parcel_id} /> : null}
        </Card>

        <Card title="Tax status">
          <TaxStatusEditor lead={l} />

          {Array.isArray(l.tax_history) && l.tax_history.length ? (
            <TaxHistoryTable rows={l.tax_history} />
          ) : null}

          {Array.isArray(l.recent_liens) && l.recent_liens.length ? (
            <LienList rows={l.recent_liens} />
          ) : null}
        </Card>

        <Card title="Contacts">
          {contacts.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : !contacts.data?.length ? (
            <div className="text-sm text-muted-foreground">
              No contacts on file{l.owner_type && l.owner_type !== "individual" ? ` (owner is ${l.owner_type})` : ""}.
            </div>
          ) : (
            <ul className="space-y-2">
              {contacts.data.map((c) => (
                <ContactRow key={c.id} c={c} />
              ))}
            </ul>
          )}
        </Card>

        <Collapsible title={`Enrichment history (${enrichment.data?.length ?? 0})`}>
          <ul className="space-y-1 text-xs">
            {enrichment.data?.map((j) => (
              <li key={j.id} className="flex justify-between">
                <span>
                  <span className="font-medium capitalize">{j.stage}</span>
                  <span
                    className={cn(
                      "ml-2 rounded px-1.5 py-0.5 text-[10px] uppercase",
                      j.status === "success"
                        ? "bg-emerald-100 text-emerald-700"
                        : j.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-200 text-gray-700",
                    )}
                  >
                    {j.status}
                  </span>
                </span>
                <span className="text-muted-foreground">{fmtRelativeDate(j.completed_at || j.created_at)}</span>
              </li>
            )) || null}
          </ul>
        </Collapsible>

        <Collapsible title={`Audit log (${audit.data?.length ?? 0})`}>
          <ul className="space-y-1 text-xs">
            {audit.data?.map((a) => (
              <li key={a.id} className="flex justify-between">
                <span className="capitalize">{a.event_type.replace(/_/g, " ")}</span>
                <span className="text-muted-foreground">{fmtRelativeDate(a.created_at)}</span>
              </li>
            )) || null}
          </ul>
        </Collapsible>

        {/* v1.1 placeholders */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button disabled className="rounded-xl border border-border bg-muted/50 py-3 text-sm text-muted-foreground">
            ✉️ Send letter (v1.1)
          </button>
          <button disabled className="rounded-xl border border-border bg-muted/50 py-3 text-sm text-muted-foreground">
            ☎️ Click to dial (v1.1)
          </button>
        </div>
      </div>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value || value === "—") return null;
  return (
    <div className="flex justify-between gap-3 py-0.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function ContactRow({ c }: { c: OwnerContact }) {
  let icon = "🟢";
  let note = "clean";
  let textCls = "text-foreground";
  if (c.contact_type === "email") {
    icon = "✉️";
    note = "email";
  } else if (c.dnc_litigator) {
    icon = "🟡";
    note = "litigator risk";
  } else if (c.dnc_federal || c.dnc_state) {
    icon = "🔴";
    note = "DNC — do not call";
    textCls = "text-muted-foreground line-through";
  }
  return (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
      <span className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <span className={cn("font-mono", textCls)}>{c.value}</span>
      </span>
      <span className="text-xs text-muted-foreground">
        {c.confidence_score != null ? `${c.confidence_score}% · ` : ""}
        {note}
      </span>
    </li>
  );
}

function TaxStatusEditor({ lead }: { lead: Lead }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [delinquent, setDelinquent] = useState<boolean>(!!lead.tax_delinquent);
  const [years, setYears] = useState<string>(lead.years_behind?.toString() ?? "");
  const [owed, setOwed] = useState<string>(lead.amount_owed?.toString() ?? "");

  const save = useMutation({
    mutationFn: async () => {
      const patch: Partial<Lead> = {
        tax_delinquent: delinquent,
        years_behind: years.trim() === "" ? null : Number(years),
        amount_owed: owed.trim() === "" ? null : Number(owed),
      };
      const { error } = await supabase.from("leads").update(patch).eq("id", lead.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead", lead.id] });
      qc.invalidateQueries({ queryKey: ["leads-list"] });
      qc.invalidateQueries({ queryKey: ["home-hot-leads"] });
      setEditing(false);
    },
  });

  if (!editing) {
    return (
      <div className="mb-2">
        <div className="flex flex-wrap items-center gap-2">
          {lead.tax_delinquent === true ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
              ⚠️ Tax distress flag
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
              ✓ Taxes current
            </span>
          )}
          {lead.years_behind && Number(lead.years_behind) > 0 ? (
            <span className="text-xs text-muted-foreground">{lead.years_behind} years behind</span>
          ) : null}
          {lead.amount_owed && Number(lead.amount_owed) > 0 ? (
            <span className="text-xs text-muted-foreground">{fmtCurrency(lead.amount_owed)} owed</span>
          ) : null}
          <button
            onClick={() => setEditing(true)}
            className="ml-auto rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground hover:bg-accent"
          >
            ✏️ Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-2 space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={delinquent} onChange={(e) => setDelinquent(e.target.checked)} />
        <span>Tax delinquent</span>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Years behind</span>
          <input
            type="number"
            step="0.5"
            min="0"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            className="rounded border border-border bg-background px-2 py-1"
            placeholder="2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Amount owed ($)</span>
          <input
            type="number"
            step="1"
            min="0"
            value={owed}
            onChange={(e) => setOwed(e.target.value)}
            className="rounded border border-border bg-background px-2 py-1"
            placeholder="8500"
          />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        After verifying with the county tax assessor, override what BatchData provided. Re-enrichment will overwrite — only update once you trust the data.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
        >
          {save.isPending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => {
            setEditing(false);
            setDelinquent(!!lead.tax_delinquent);
            setYears(lead.years_behind?.toString() ?? "");
            setOwed(lead.amount_owed?.toString() ?? "");
          }}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium"
        >
          Cancel
        </button>
      </div>
      {save.error ? (
        <p className="text-xs text-red-600">Save failed: {String((save.error as Error).message)}</p>
      ) : null}
    </div>
  );
}

function TaxHistoryTable({ rows }: { rows: TaxHistoryEntry[] }) {
  return (
    <div className="mt-2">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Annual property tax (last {rows.length})
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.slice(0, 8).map((t, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0">
              <td className="py-1 text-muted-foreground">{t.year}</td>
              <td className="py-1 text-right font-medium tabular-nums">{fmtCurrency(t.amount)}</td>
              <td className="py-1 pl-2 text-right text-xs">
                {t.delinquent ? <span className="text-red-600">⚠️ delinquent</span> : t.paid === false ? <span className="text-amber-600">unpaid</span> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LienList({ rows }: { rows: LienEntry[] }) {
  return (
    <div className="mt-3">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Recent liens ({rows.length})
      </div>
      <ul className="space-y-1 text-sm">
        {rows.slice(0, 5).map((l, i) => (
          <li key={i} className="flex justify-between rounded border border-border bg-card px-2 py-1">
            <span>{l.document_type || l.lien_type || "lien"}</span>
            <span className="text-xs text-muted-foreground">
              {l.filing_date ? l.filing_date.split("T")[0] : "?"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Collapsible({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mb-3 rounded-2xl border border-border bg-card shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open ? <div className="border-t border-border px-4 py-3">{children}</div> : null}
    </section>
  );
}


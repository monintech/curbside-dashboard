// Hand-written TS types for the Curbside schema.
// Mirror of the SQL in curbside-prd/02-database.md plus Phase-4 additions.

export type LeadStatus =
  | "new"
  | "enriching"
  | "enriched"
  | "mailed"
  | "contacted"
  | "interested"
  | "not_interested"
  | "contract"
  | "closed"
  | "dead"
  | "error";

export type OwnerType =
  | "individual"
  | "llc"
  | "trust"
  | "estate"
  | "corporation"
  | string
  | null;

export interface TaxHistoryEntry {
  year: number;
  amount: number | null;
  paid?: boolean | null;
  delinquent?: boolean | null;
}

export interface LienEntry {
  filing_date: string | null;
  document_type: string | null;
  lien_type: string | null;
  document_number?: string | null;
}

export interface Lead {
  id: string;
  org_id: string;
  captured_by: string | null;
  captured_at: string;
  photo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  property_address_line1: string | null;
  property_city: string | null;
  property_state: string | null;
  property_zip: string | null;
  county: string | null;
  parcel_id: string | null;
  owner_name: string | null;
  owner_first_name: string | null;
  owner_last_name: string | null;
  owner_type: OwnerType;
  mailing_address_line1: string | null;
  mailing_city: string | null;
  mailing_state: string | null;
  mailing_zip: string | null;
  is_absentee: boolean | null;
  years_owned: number | null;
  last_sale_price: number | null;
  last_sale_date: string | null;
  estimated_value: number | null;
  estimated_equity: number | null;
  mortgage_balance: number | null;
  has_mortgage: boolean | null;
  tax_delinquent: boolean | null;
  years_behind: number | null;
  amount_owed: number | null;
  tax_history: TaxHistoryEntry[] | null;
  recent_liens: LienEntry[] | null;
  motivation_score: number | null;
  ai_notes: string | null;
  suggested_angle: string | null;
  status: LeadStatus | string;
  enrichment_error: string | null;
  consent_sms: boolean | null;
  consent_voice: boolean | null;
  consent_source: string | null;
  consent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OwnerContact {
  id: string;
  lead_id: string;
  contact_type: "phone" | "email";
  value: string;
  confidence_score: number | null;
  dnc_federal: boolean | null;
  dnc_state: boolean | null;
  dnc_litigator: boolean | null;
  dnc_checked_at: string | null;
  is_dialable: boolean;
  source: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  org_id: string | null;
  user_id: string | null;
  lead_id: string | null;
  event_type: string;
  event_data: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface EnrichmentJob {
  id: string;
  lead_id: string;
  stage: string;
  status: string;
  request_payload: Record<string, unknown> | null;
  response_payload: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Org {
  id: string;
  name: string;
  from_address_line1: string | null;
  from_city: string | null;
  from_state: string | null;
  from_zip: string | null;
  callback_phone: string | null;
}

export interface Database {
  public: {
    Tables: {
      leads: { Row: Lead; Insert: Partial<Lead>; Update: Partial<Lead> };
      owner_contacts: { Row: OwnerContact; Insert: Partial<OwnerContact>; Update: Partial<OwnerContact> };
      audit_log: { Row: AuditLogEntry; Insert: Partial<AuditLogEntry>; Update: Partial<AuditLogEntry> };
      enrichment_jobs: { Row: EnrichmentJob; Insert: Partial<EnrichmentJob>; Update: Partial<EnrichmentJob> };
      orgs: { Row: Org; Insert: Partial<Org>; Update: Partial<Org> };
    };
  };
}

export interface BankSummary {
  cert: number;
  name: string;
  city: string;
  stname: string;
  zip?: string;
  asset?: number;
  repdte?: string;
  charter_class?: string;
  specgrp?: number;
  active: boolean;
  roa?: number;
  roe?: number;
  nim?: number;
  efficiency_ratio?: number;
  loan_to_deposit?: number;
  npl_ratio?: number;
  tier1_ratio?: number;
}

export interface BankFinancials {
  cert: number;
  repdte: string;
  asset?: number;
  dep?: number;
  lnlsnet?: number;
  netinc?: number;
  intinc?: number;
  eintexp?: number;
  nonii?: number;
  nonix?: number;
  eq?: number;
  roa?: number;
  roe?: number;
  nim?: number;
  efficiency_ratio?: number;
  loan_to_deposit?: number;
  npl_ratio?: number;
  tier1_ratio?: number;
}

export interface Branch {
  cert: number;
  brnum: number;
  brname: string;
  city: string;
  stname: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  bkclass?: string;
}

export interface CreditUnion {
  cu_number: number;
  cu_name: string;
  state: string;
  city: string;
  asset_total?: number;
  member_count?: number;
  roa?: number;
  net_worth_ratio?: number;
  loan_to_asset?: number;
  delinquency_rate?: number;
}

export interface ScreenerFilters {
  state?: string[];
  city?: string;
  asset_min?: number;
  asset_max?: number;
  charter_class?: string[];
  specgrp?: number[];
  roa_min?: number;
  roa_max?: number;
  roe_min?: number;
  roe_max?: number;
  nim_min?: number;
  nim_max?: number;
  efficiency_min?: number;
  efficiency_max?: number;
  npl_min?: number;
  npl_max?: number;
  tier1_min?: number;
  loan_to_deposit_min?: number;
  loan_to_deposit_max?: number;
  ptbv_min?: number;
  ptbv_max?: number;
  ma_prob_min?: number;
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_dir?: string;
}

export interface PeerComparePeer {
  cert: number;
  name: string;
  state?: string;
  asset?: number;
  repdte?: string;
  roa?: number;
  roe?: number;
  nim?: number;
  efficiency_ratio?: number;
  loan_to_deposit?: number;
  npl_ratio?: number;
  tier1_ratio?: number;
}

export interface ScreenerResponse {
  total: number;
  data: BankSummary[];
}

export interface FinancialsResponse {
  cert: number;
  count: number;
  data: BankFinancials[];
}

export interface BranchesResponse {
  cert: number;
  count: number;
  branches: Branch[];
}

export interface PeerCompareResponse {
  peers: PeerComparePeer[];
}

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

export const CHARTER_CLASSES = [
  { value: "N", label: "National Bank" },
  { value: "SM", label: "State Member" },
  { value: "NM", label: "State Non-Member" },
  { value: "SB", label: "Savings Bank" },
  { value: "SA", label: "Savings Assoc." },
  { value: "OI", label: "Other Insured" },
];

export function formatAsset(val?: number): string {
  if (!val) return "—";
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}B`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}M`;
  return `$${val.toFixed(0)}K`;
}

export function formatPct(val?: number | null, decimals = 2): string {
  if (val == null) return "—";
  return `${val.toFixed(decimals)}%`;
}

export function formatRatio(val?: number | null): string {
  if (val == null) return "—";
  return val.toFixed(2);
}

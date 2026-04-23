import type {
  ScreenerFilters,
  ScreenerResponse,
  FinancialsResponse,
  BranchesResponse,
  PeerCompareResponse,
  CreditUnion,
} from "./types";

const BASE = "/api";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const url = new URL(`${BASE}${path}`, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export const api = {
  banks: {
    screen: (filters: ScreenerFilters) =>
      post<ScreenerResponse>("/banks/screen", filters),

    exportUrl: (state?: string, assetMin?: number, assetMax?: number) => {
      const params = new URLSearchParams();
      if (state) params.set("state", state);
      if (assetMin !== undefined) params.set("asset_min", String(assetMin));
      if (assetMax !== undefined) params.set("asset_max", String(assetMax));
      return `${BASE}/banks/export?${params}`;
    },
  },

  financials: {
    get: (cert: number, limit = 80) =>
      get<FinancialsResponse>(`/financials/${cert}`, { limit }),

    peerCompare: (certs: number[]) =>
      post<PeerCompareResponse>("/financials/peer-compare", { certs }),
  },

  branches: {
    get: (cert: number) =>
      get<BranchesResponse>(`/branches/${cert}`),

    byState: (state: string) =>
      get<{ state: string; count: number; branches: unknown[] }>(`/branches/state/${state}`),
  },

  creditUnions: {
    screen: (params: {
      state?: string;
      asset_min?: number;
      asset_max?: number;
      limit?: number;
      offset?: number;
    }) =>
      get<{ count: number; data: CreditUnion[] }>("/credit-unions/", {
        ...params,
        limit: params.limit ?? 50,
      }),
  },
};

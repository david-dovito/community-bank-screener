"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { CreditUnionTable } from "@/components/screener/CreditUnionTable";
import { US_STATES } from "@/lib/types";

export default function CreditUnionsPage() {
  const [state, setState] = useState<string | undefined>(undefined);
  const [assetMin, setAssetMin] = useState<number | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ["credit-unions", state, assetMin],
    queryFn: () => api.creditUnions.screen({ state, asset_min: assetMin, limit: 100 }),
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Credit Union Screener</h1>
        <p className="text-sm text-muted-foreground mt-1">
          NCUA quarterly call report data
          {data ? ` — ${data.count.toLocaleString()} results` : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={state ?? ""}
          onChange={(e) => setState(e.target.value || undefined)}
          className="px-3 py-2 rounded-md border border-input bg-background text-sm"
        >
          <option value="">All States</option>
          {US_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={assetMin ?? ""}
          onChange={(e) => setAssetMin(e.target.value ? Number(e.target.value) : undefined)}
          className="px-3 py-2 rounded-md border border-input bg-background text-sm"
        >
          <option value="">Any Size</option>
          <option value="10000">$10M+</option>
          <option value="100000">$100M+</option>
          <option value="500000">$500M+</option>
          <option value="1000000">$1B+</option>
        </select>
      </div>

      <CreditUnionTable data={data?.data ?? []} isLoading={isLoading} />
    </div>
  );
}

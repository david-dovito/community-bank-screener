"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ScreenerPanel } from "@/components/screener/ScreenerPanel";
import { BankTable } from "@/components/screener/BankTable";
import type { ScreenerFilters } from "@/lib/types";
import { Download } from "lucide-react";

const DEFAULT_FILTERS: ScreenerFilters = {
  limit: 50,
  offset: 0,
  sort_by: "asset",
  sort_dir: "desc",
};

export default function HomePage() {
  const [filters, setFilters] = useState<ScreenerFilters>(DEFAULT_FILTERS);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["banks", "screen", filters],
    queryFn: () => api.banks.screen(filters),
    placeholderData: (prev) => prev,
  });

  const handleFiltersChange = (f: ScreenerFilters) => {
    setFilters({ ...f, offset: 0 });
  };

  const handlePageChange = (offset: number) => {
    setFilters((prev) => ({ ...prev, offset }));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Community Bank Screener</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.total ? `${data.total.toLocaleString()} banks match your filters` : "FDIC + NCUA data, updated quarterly"}
          </p>
        </div>
        <a
          href={api.banks.exportUrl(
            filters.state?.[0],
            filters.asset_min,
            filters.asset_max,
          )}
          className="flex items-center gap-2 text-sm px-3 py-2 rounded-md border border-border hover:bg-muted transition-colors"
          download="banks.csv"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <ScreenerPanel filters={filters} onChange={handleFiltersChange} />

        <div>
          {isError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              Failed to load data. Is the backend running?
            </div>
          )}
          <BankTable
            data={data?.data ?? []}
            total={data?.total ?? 0}
            isLoading={isLoading}
            filters={filters}
            onPageChange={handlePageChange}
            onSortChange={(sort_by, sort_dir) =>
              setFilters((prev) => ({ ...prev, sort_by, sort_dir }))
            }
          />
        </div>
      </div>
    </div>
  );
}

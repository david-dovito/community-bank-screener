"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { US_STATES } from "@/lib/types";
import dynamic from "next/dynamic";

// Leaflet can't SSR
const BranchMap = dynamic(() => import("@/components/map/BranchMap"), { ssr: false });

export default function MapPage() {
  const [state, setState] = useState("CO");

  const { data, isLoading } = useQuery({
    queryKey: ["branches-state", state],
    queryFn: () => api.branches.byState(state),
  });

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Branch Map</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data ? `${data.count.toLocaleString()} branches in ${state}` : "Interactive branch heatmap"}
          </p>
        </div>

        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="ml-auto px-3 py-2 rounded-md border border-input bg-background text-sm"
        >
          {US_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-border overflow-hidden" style={{ height: "70vh" }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Loading branches...
          </div>
        ) : (
          <BranchMap branches={(data?.branches as any[]) ?? []} />
        )}
      </div>
    </div>
  );
}

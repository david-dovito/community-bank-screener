"use client";

import type { PeerComparePeer } from "@/lib/types";
import { formatAsset, formatPct } from "@/lib/types";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Props {
  peers: PeerComparePeer[];
  isLoading: boolean;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

const METRICS: { key: keyof PeerComparePeer; label: string }[] = [
  { key: "roa", label: "ROA (%)" },
  { key: "roe", label: "ROE (%)" },
  { key: "nim", label: "NIM (%)" },
  { key: "efficiency_ratio", label: "Efficiency (%)" },
  { key: "npl_ratio", label: "NPL (%)" },
  { key: "tier1_ratio", label: "Tier 1 (%)" },
];

export function PeerCompare({ peers, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Loading peer comparison...
      </div>
    );
  }

  if (peers.length === 0) return null;

  // Build bar chart data per metric
  const metricData = METRICS.map(({ key, label }) => {
    const entry: Record<string, string | number | null> = { metric: label };
    for (const p of peers) {
      entry[p.name] = (p[key] as number) ?? null;
    }
    return entry;
  });

  // Radar chart — normalize each metric to 0-100
  const radarData = METRICS.map(({ key, label }) => {
    const values = peers.map((p) => (p[key] as number) ?? 0);
    const max = Math.max(...values) || 1;
    const entry: Record<string, string | number> = { subject: label };
    for (const p of peers) {
      entry[p.name] = (((p[key] as number) ?? 0) / max) * 100;
    }
    return entry;
  });

  return (
    <div className="space-y-6">
      {/* Summary table */}
      <div className="rounded-lg border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Metric</th>
              {peers.map((p, i) => (
                <th key={p.cert} className="px-3 py-2.5 text-left text-xs font-medium" style={{ color: COLORS[i] }}>
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr className="bg-muted/20">
              <td className="px-3 py-2 text-xs text-muted-foreground">Total Assets</td>
              {peers.map((p) => (
                <td key={p.cert} className="px-3 py-2 font-mono text-xs">{formatAsset(p.asset)}</td>
              ))}
            </tr>
            {METRICS.map(({ key, label }) => (
              <tr key={key} className="hover:bg-muted/30">
                <td className="px-3 py-2 text-xs text-muted-foreground">{label}</td>
                {peers.map((p) => (
                  <td key={p.cert} className="px-3 py-2 font-mono text-xs">
                    {formatPct(p[key] as number)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Radar chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium mb-4">Normalized Radar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
              {peers.map((p, i) => (
                <Radar
                  key={p.cert}
                  name={p.name}
                  dataKey={p.name}
                  stroke={COLORS[i]}
                  fill={COLORS[i]}
                  fillOpacity={0.15}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart per metric */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium mb-4">Metric Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metricData} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="metric" tick={{ fontSize: 10 }} width={80} />
              <Tooltip
                formatter={(v: number, name: string) => [`${v?.toFixed(2)}%`, name]}
                contentStyle={{ fontSize: 11 }}
              />
              {peers.map((p, i) => (
                <Bar key={p.cert} dataKey={p.name} fill={COLORS[i]} radius={[0, 2, 2, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

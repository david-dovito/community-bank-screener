"use client";

import type { FinancialsResponse, BranchesResponse } from "@/lib/types";
import { formatAsset, formatPct } from "@/lib/types";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const BranchMap = dynamic(() => import("@/components/map/BranchMap"), { ssr: false });

interface Props {
  cert: number;
  financials: FinancialsResponse;
  branches?: BranchesResponse;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}

const CHART_COLORS = {
  roa: "#3b82f6",
  roe: "#8b5cf6",
  nim: "#10b981",
  efficiency_ratio: "#f59e0b",
  npl_ratio: "#ef4444",
};

export function TearSheet({ cert, financials, branches }: Props) {
  const data = financials.data;
  const latest = data[0];

  if (!latest) return <p className="text-sm text-muted-foreground">No data available.</p>;

  // Reverse for chronological chart order
  const chartData = [...data].reverse().map((d) => ({
    date: d.repdte,
    assets: d.asset ? d.asset / 1000 : null, // convert to millions
    roa: d.roa,
    roe: d.roe,
    nim: d.nim,
    efficiency_ratio: d.efficiency_ratio,
    npl_ratio: d.npl_ratio,
    tier1: d.tier1_ratio,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">CERT {cert}</h1>
          <p className="text-sm text-muted-foreground">
            As of {latest.repdte} · {financials.count} quarters of data
          </p>
        </div>

        <Link
          href={`/compare?certs=${cert}`}
          className="ml-auto text-sm px-3 py-2 rounded-md border border-border hover:bg-muted transition-colors"
        >
          Add to comparison
        </Link>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <MetricCard label="Total Assets" value={formatAsset(latest.asset)} />
        <MetricCard label="Deposits" value={formatAsset(latest.dep)} />
        <MetricCard label="Net Loans" value={formatAsset(latest.lnlsnet)} />
        <MetricCard label="Equity" value={formatAsset(latest.eq)} />
        <MetricCard label="ROA" value={formatPct(latest.roa)} />
        <MetricCard label="ROE" value={formatPct(latest.roe)} />
        <MetricCard label="NIM" value={formatPct(latest.nim)} />
        <MetricCard label="Efficiency" value={formatPct(latest.efficiency_ratio, 1)} />
      </div>

      {/* Asset growth */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium mb-4">Total Assets (Millions USD)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}M`} />
            <Tooltip
              formatter={(v: number) => [`$${v?.toFixed(1)}M`, "Assets"]}
              contentStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="assets" fill="#3b82f6" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Profitability ratios */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium mb-4">ROA / ROE / NIM (20-Year History)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(v: number, name: string) => [`${v?.toFixed(2)}%`, name.toUpperCase()]}
              contentStyle={{ fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="roa" stroke={CHART_COLORS.roa} dot={false} name="ROA" />
            <Line type="monotone" dataKey="roe" stroke={CHART_COLORS.roe} dot={false} name="ROE" />
            <Line type="monotone" dataKey="nim" stroke={CHART_COLORS.nim} dot={false} name="NIM" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Credit quality */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium mb-4">Credit Quality — NPL Ratio & Efficiency</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              formatter={(v: number, name: string) => [`${v?.toFixed(2)}%`, name]}
              contentStyle={{ fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="npl_ratio" stroke={CHART_COLORS.npl_ratio} dot={false} name="NPL Ratio" />
            <Line type="monotone" dataKey="efficiency_ratio" stroke={CHART_COLORS.efficiency_ratio} dot={false} name="Efficiency" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Branch map */}
      {branches && branches.count > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-medium mb-3">
            Branch Network — {branches.count} locations
          </h3>
          <div style={{ height: 400 }}>
            <BranchMap branches={branches.branches} />
          </div>
        </div>
      )}

      {/* Raw data table */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium mb-3">Historical Financials</h3>
        <div className="overflow-auto">
          <table className="w-full text-xs font-mono">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {["Date", "Assets", "Deposits", "Net Loans", "Net Income", "ROA", "ROE", "NIM", "Eff. Ratio", "NPL", "Tier 1"].map((h) => (
                  <th key={h} className="px-2 py-1.5 text-left text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((row) => (
                <tr key={row.repdte} className="hover:bg-muted/30">
                  <td className="px-2 py-1.5 whitespace-nowrap">{row.repdte}</td>
                  <td className="px-2 py-1.5">{formatAsset(row.asset)}</td>
                  <td className="px-2 py-1.5">{formatAsset(row.dep)}</td>
                  <td className="px-2 py-1.5">{formatAsset(row.lnlsnet)}</td>
                  <td className="px-2 py-1.5">{formatAsset(row.netinc)}</td>
                  <td className="px-2 py-1.5">{formatPct(row.roa)}</td>
                  <td className="px-2 py-1.5">{formatPct(row.roe)}</td>
                  <td className="px-2 py-1.5">{formatPct(row.nim)}</td>
                  <td className="px-2 py-1.5">{formatPct(row.efficiency_ratio, 1)}</td>
                  <td className="px-2 py-1.5">{formatPct(row.npl_ratio)}</td>
                  <td className="px-2 py-1.5">{formatPct(row.tier1_ratio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

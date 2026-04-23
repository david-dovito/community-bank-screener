"use client";

import type { CreditUnion } from "@/lib/types";
import { formatAsset, formatPct } from "@/lib/types";

interface Props {
  data: CreditUnion[];
  isLoading: boolean;
}

export function CreditUnionTable({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border py-16 text-center text-sm text-muted-foreground">
        Loading credit unions...
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b border-border">
          <tr>
            {["Name", "State", "City", "Assets", "Members", "ROA", "Net Worth Ratio", "Loan/Asset", "Delinquency"].map((h) => (
              <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                No credit unions found.
              </td>
            </tr>
          ) : (
            data.map((cu) => (
              <tr key={cu.cu_number} className="hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2.5 font-medium">{cu.cu_name}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{cu.state}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{cu.city}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{formatAsset(cu.asset_total)}</td>
                <td className="px-3 py-2.5 font-mono text-xs">
                  {cu.member_count ? cu.member_count.toLocaleString() : "—"}
                </td>
                <td className="px-3 py-2.5 font-mono text-xs">{formatPct(cu.roa)}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{formatPct(cu.net_worth_ratio)}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{formatPct(cu.loan_to_asset)}</td>
                <td className="px-3 py-2.5 font-mono text-xs">{formatPct(cu.delinquency_rate)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

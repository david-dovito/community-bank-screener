"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import Link from "next/link";
import type { BankSummary, ScreenerFilters } from "@/lib/types";
import { formatAsset, formatPct } from "@/lib/types";
import { ChevronUp, ChevronDown, ChevronsUpDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  data: BankSummary[];
  total: number;
  isLoading: boolean;
  filters: ScreenerFilters;
  onPageChange: (offset: number) => void;
  onSortChange: (sort_by: string, sort_dir: string) => void;
}

function MetricCell({ value, good = "high" }: { value?: number | null; good?: "high" | "low" }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const isGood = good === "high" ? value > 0 : value < 50;
  return (
    <span className={cn("font-mono text-xs", isGood ? "text-emerald-600" : "text-rose-600")}>
      {value.toFixed(2)}%
    </span>
  );
}

const columns: ColumnDef<BankSummary>[] = [
  {
    accessorKey: "name",
    header: "Bank",
    cell: ({ row }) => (
      <div>
        <Link
          href={`/banks/${row.original.cert}`}
          className="font-medium text-sm text-primary hover:underline flex items-center gap-1"
        >
          {row.original.name}
          <ExternalLink className="h-3 w-3 opacity-50" />
        </Link>
        <p className="text-xs text-muted-foreground">
          {row.original.city}, {row.original.stname}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "asset",
    header: "Assets",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs">{formatAsset(getValue() as number)}</span>
    ),
  },
  {
    accessorKey: "charter_class",
    header: "Charter",
    cell: ({ getValue }) => (
      <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{getValue() as string ?? "—"}</span>
    ),
  },
  {
    accessorKey: "roa",
    header: "ROA",
    cell: ({ getValue }) => <MetricCell value={getValue() as number} good="high" />,
  },
  {
    accessorKey: "roe",
    header: "ROE",
    cell: ({ getValue }) => <MetricCell value={getValue() as number} good="high" />,
  },
  {
    accessorKey: "nim",
    header: "NIM",
    cell: ({ getValue }) => <MetricCell value={getValue() as number} good="high" />,
  },
  {
    accessorKey: "efficiency_ratio",
    header: "Eff. Ratio",
    cell: ({ getValue }) => <MetricCell value={getValue() as number} good="low" />,
  },
  {
    accessorKey: "npl_ratio",
    header: "NPL",
    cell: ({ getValue }) => <MetricCell value={getValue() as number} good="low" />,
  },
  {
    accessorKey: "tier1_ratio",
    header: "Tier 1",
    cell: ({ getValue }) => <MetricCell value={getValue() as number} good="high" />,
  },
  {
    accessorKey: "repdte",
    header: "Report Date",
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground">{getValue() as string ?? "—"}</span>
    ),
  },
];

const SORT_MAP: Record<string, string> = {
  name: "name",
  asset: "asset",
  stname: "state",
};

export function BankTable({ data, total, isLoading, filters, onPageChange, onSortChange }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    rowCount: total,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next);
      if (next.length > 0) {
        const col = next[0];
        onSortChange(SORT_MAP[col.id] ?? col.id, col.desc ? "desc" : "asc");
      }
    },
  });

  const pageSize = filters.limit ?? 50;
  const offset = filters.offset ?? 0;
  const totalPages = Math.ceil(total / pageSize);
  const currentPage = Math.floor(offset / pageSize);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          Loading banks...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap cursor-pointer select-none hover:text-foreground"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <span className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : header.column.getIsSorted() === "desc" ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-sm text-muted-foreground">
                  No banks match your filters.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {offset + 1}–{Math.min(offset + data.length, total)} of {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 0}
              onClick={() => onPageChange(Math.max(0, offset - pageSize))}
              className="px-3 py-1.5 rounded border border-border text-xs disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Previous
            </button>
            <span className="text-xs text-muted-foreground">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages - 1}
              onClick={() => onPageChange(offset + pageSize)}
              className="px-3 py-1.5 rounded border border-border text-xs disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

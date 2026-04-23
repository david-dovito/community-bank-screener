"use client";

import { useState } from "react";
import type { ScreenerFilters } from "@/lib/types";
import { US_STATES, CHARTER_CLASSES } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";

interface Props {
  filters: ScreenerFilters;
  onChange: (f: ScreenerFilters) => void;
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border last:border-0">
      <button
        className="flex items-center justify-between w-full py-3 text-sm font-medium text-left"
        onClick={() => setOpen(!open)}
      >
        {title}
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </button>
      {open && <div className="pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function RangeRow({
  label,
  minVal,
  maxVal,
  onMin,
  onMax,
  placeholder = "Min",
}: {
  label: string;
  minVal?: number;
  maxVal?: number;
  onMin: (v: number | undefined) => void;
  onMax: (v: number | undefined) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex gap-2 mt-1">
        <input
          type="number"
          placeholder={placeholder}
          value={minVal ?? ""}
          onChange={(e) => onMin(e.target.value ? Number(e.target.value) : undefined)}
          className="w-full px-2 py-1 text-xs rounded border border-input bg-background"
        />
        <input
          type="number"
          placeholder="Max"
          value={maxVal ?? ""}
          onChange={(e) => onMax(e.target.value ? Number(e.target.value) : undefined)}
          className="w-full px-2 py-1 text-xs rounded border border-input bg-background"
        />
      </div>
    </div>
  );
}

const DEFAULT: ScreenerFilters = { limit: 50, offset: 0, sort_by: "asset", sort_dir: "desc" };

export function ScreenerPanel({ filters, onChange }: Props) {
  const update = (partial: Partial<ScreenerFilters>) =>
    onChange({ ...filters, ...partial });

  const toggleState = (s: string) => {
    const cur = filters.state ?? [];
    const next = cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s];
    update({ state: next.length > 0 ? next : undefined });
  };

  const toggleCharter = (c: string) => {
    const cur = filters.charter_class ?? [];
    const next = cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c];
    update({ charter_class: next.length > 0 ? next : undefined });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-0 h-fit sticky top-20">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold">Filters</span>
        <button
          onClick={() => onChange(DEFAULT)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      <Section title="Geography">
        <div>
          <label className="text-xs text-muted-foreground">States</label>
          <div className="grid grid-cols-5 gap-0.5 mt-1 max-h-32 overflow-y-auto">
            {US_STATES.map((s) => (
              <button
                key={s}
                onClick={() => toggleState(s)}
                className={cn(
                  "text-xs px-1 py-0.5 rounded transition-colors",
                  filters.state?.includes(s)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Asset Size ($K)">
        <RangeRow
          label="Assets (thousands USD)"
          minVal={filters.asset_min}
          maxVal={filters.asset_max}
          onMin={(v) => update({ asset_min: v })}
          onMax={(v) => update({ asset_max: v })}
          placeholder="e.g. 100000"
        />
        <div className="flex flex-wrap gap-1">
          {[
            { label: "<$100M", min: undefined, max: 100_000 },
            { label: "$100M–$500M", min: 100_000, max: 500_000 },
            { label: "$500M–$1B", min: 500_000, max: 1_000_000 },
            { label: "$1B+", min: 1_000_000, max: undefined },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => update({ asset_min: preset.min, asset_max: preset.max })}
              className="text-xs px-2 py-0.5 rounded border border-border hover:bg-muted"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Charter Type" defaultOpen={false}>
        <div className="space-y-1">
          {CHARTER_CLASSES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={filters.charter_class?.includes(value) ?? false}
                onChange={() => toggleCharter(value)}
                className="rounded"
              />
              {label}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Profitability" defaultOpen={false}>
        <RangeRow
          label="ROA (%)"
          minVal={filters.roa_min}
          maxVal={filters.roa_max}
          onMin={(v) => update({ roa_min: v })}
          onMax={(v) => update({ roa_max: v })}
        />
        <RangeRow
          label="ROE (%)"
          minVal={filters.roe_min}
          maxVal={filters.roe_max}
          onMin={(v) => update({ roe_min: v })}
          onMax={(v) => update({ roe_max: v })}
        />
        <RangeRow
          label="NIM (%)"
          minVal={filters.nim_min}
          maxVal={filters.nim_max}
          onMin={(v) => update({ nim_min: v })}
          onMax={(v) => update({ nim_max: v })}
        />
      </Section>

      <Section title="Efficiency" defaultOpen={false}>
        <RangeRow
          label="Efficiency Ratio (%)"
          minVal={filters.efficiency_min}
          maxVal={filters.efficiency_max}
          onMin={(v) => update({ efficiency_min: v })}
          onMax={(v) => update({ efficiency_max: v })}
        />
        <RangeRow
          label="Loan-to-Deposit (%)"
          minVal={filters.loan_to_deposit_min}
          maxVal={filters.loan_to_deposit_max}
          onMin={(v) => update({ loan_to_deposit_min: v })}
          onMax={(v) => update({ loan_to_deposit_max: v })}
        />
      </Section>

      <Section title="Credit Quality" defaultOpen={false}>
        <RangeRow
          label="NPL Ratio (%)"
          minVal={filters.npl_min}
          maxVal={filters.npl_max}
          onMin={(v) => update({ npl_min: v })}
          onMax={(v) => update({ npl_max: v })}
        />
        <RangeRow
          label="Tier 1 Capital (%) — Min"
          minVal={filters.tier1_min}
          maxVal={undefined}
          onMin={(v) => update({ tier1_min: v })}
          onMax={() => {}}
        />
      </Section>

      <Section title="M&A Score" defaultOpen={false}>
        <RangeRow
          label="M&A Probability Score (0–100)"
          minVal={filters.ma_prob_min}
          maxVal={undefined}
          onMin={(v) => update({ ma_prob_min: v })}
          onMax={() => {}}
        />
        <p className="text-xs text-muted-foreground">
          Model factors: age, ROA trend, efficiency ratio, asset size, market concentration.
        </p>
      </Section>
    </div>
  );
}

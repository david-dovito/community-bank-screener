"use client";

export default function MutualTrackerPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mutual-to-Stock Conversion Tracker</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track thrift conversions — IPO-stage banks that historically trade below tangible book value.
        </p>
      </div>

      <div className="rounded-lg border border-border p-8 text-center space-y-3">
        <p className="text-sm font-medium">How this works</p>
        <p className="text-sm text-muted-foreground max-w-prose mx-auto">
          Mutual savings banks converting to stock form must sell shares at or near book value
          under OCC/FDIC rules. First-step and second-step conversions create a structural
          discount that narrows over 12–36 months as the bank deploys excess capital.
        </p>
        <p className="text-sm text-muted-foreground max-w-prose mx-auto">
          Conversion filings are published at{" "}
          <a
            href="https://www.fdic.gov/bank/individual/financial/index.html"
            className="text-primary underline"
            target="_blank"
            rel="noreferrer"
          >
            FDIC
          </a>{" "}
          and{" "}
          <a
            href="https://www.sec.gov/cgi-bin/browse-edgar"
            className="text-primary underline"
            target="_blank"
            rel="noreferrer"
          >
            SEC EDGAR
          </a>
          . Filter for SB-2 and S-11 forms.
        </p>
        <div className="mt-6 rounded-md border border-border bg-muted/30 p-4 text-left max-w-lg mx-auto">
          <p className="text-xs font-mono text-muted-foreground">
            Coming in v0.2: automated EDGAR scraper for SB-2 filings,
            P/TBV tracker, insider purchase alerts.
          </p>
        </div>
      </div>
    </div>
  );
}

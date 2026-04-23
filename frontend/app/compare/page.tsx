"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PeerCompare } from "@/components/tearsheet/PeerCompare";
import { X, Plus } from "lucide-react";

export default function ComparePage() {
  const [certs, setCerts] = useState<number[]>([]);
  const [input, setInput] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["peer-compare", certs],
    queryFn: () => api.financials.peerCompare(certs),
    enabled: certs.length >= 2,
  });

  const addCert = () => {
    const n = parseInt(input.trim(), 10);
    if (!isNaN(n) && !certs.includes(n) && certs.length < 5) {
      setCerts((prev) => [...prev, n]);
      setInput("");
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Peer Comparison</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compare up to 5 banks side-by-side. Enter FDIC CERT numbers.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {certs.map((c) => (
          <span
            key={c}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
          >
            CERT {c}
            <button onClick={() => setCerts((prev) => prev.filter((x) => x !== c))}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {certs.length < 5 && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCert()}
              placeholder="CERT number"
              className="w-32 px-3 py-1 text-sm rounded-md border border-input bg-background"
            />
            <button
              onClick={addCert}
              className="flex items-center gap-1 px-3 py-1 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add
            </button>
          </div>
        )}
      </div>

      {certs.length < 2 && (
        <p className="text-sm text-muted-foreground">Add at least 2 CERT numbers to compare.</p>
      )}

      {certs.length >= 2 && (
        <PeerCompare
          peers={data?.peers ?? []}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

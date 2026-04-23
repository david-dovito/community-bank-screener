"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TearSheet } from "@/components/tearsheet/TearSheet";

export default function BankDetailPage() {
  const { cert } = useParams<{ cert: string }>();
  const certNum = parseInt(cert, 10);

  const { data: fins, isLoading } = useQuery({
    queryKey: ["financials", certNum],
    queryFn: () => api.financials.get(certNum),
    enabled: !isNaN(certNum),
  });

  const { data: branches } = useQuery({
    queryKey: ["branches", certNum],
    queryFn: () => api.branches.get(certNum),
    enabled: !isNaN(certNum),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 text-center text-muted-foreground text-sm">
        Loading tear sheet...
      </div>
    );
  }

  if (!fins) {
    return (
      <div className="container mx-auto py-10 text-center text-destructive text-sm">
        Bank not found (CERT: {cert})
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <TearSheet cert={certNum} financials={fins} branches={branches} />
    </div>
  );
}

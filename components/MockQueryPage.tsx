"use client";

import { QueryPage } from "@/components/dashboard/query-page";
import { mockQuery, type QueryType } from "@/lib/mock-query-api";

interface MockQueryPageProps {
  queryType: QueryType;
  title: string;
  description: string;
  inputLabel: string;
  inputPlaceholder: string;
}

export function MockQueryPage({
  queryType,
  title,
  description,
  inputLabel,
  inputPlaceholder,
}: MockQueryPageProps) {
  return (
    <QueryPage
      title={title}
      description={description}
      inputLabel={inputLabel}
      inputPlaceholder={inputPlaceholder}
      onQuery={async (value) => mockQuery(queryType, value)}
    />
  );
}

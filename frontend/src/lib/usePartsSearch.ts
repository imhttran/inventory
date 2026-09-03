"use client";

import { useEffect, useState } from "react";
import { API_BASE, renewSessionFrom } from "./api";

export type SearchHit = {
  id: string;
  sku: string;
  partNumber: string | null;
  name: string;
  brand: string;
  category: string;
  score: number;
};

export type SearchResponse = {
  products: SearchHit[];
  source: "elasticsearch" | "postgres" | "none";
  message?: string;
};

export type SearchSource = SearchResponse["source"];

// Source label — the API serves from Elasticsearch when it's up and falls
// back to Postgres ILIKE otherwise; the badge makes the engine visible.
export const SOURCE_LABEL: Record<SearchSource, string> = {
  elasticsearch: "via Elasticsearch",
  postgres: "via PostgreSQL (fallback)",
  none: "",
};

const DEBOUNCE_MS = 300;

// Debounced catalog search (GET /api/v1/search). Pass enabled=false until auth
// is ready so the hook stays idle; results are null until the first query
// runs. Shared by the Search page and the dashboard quick search.
export function usePartsSearch(enabled: boolean) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[] | null>(null);
  const [source, setSource] = useState<SearchSource>("none");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setFailed(false);
      return;
    }
    // An in-flight response must never overwrite a newer query's results.
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(
            `${API_BASE}/api/v1/search?q=${encodeURIComponent(trimmed)}`,
            { headers: { Authorization: `Bearer ${authToken}` } },
          );
          renewSessionFrom(response);
          const data = (await response.json()) as SearchResponse;
          if (!response.ok) throw new Error(data.message ?? "search failed");
          if (cancelled) return;
          setResults(data.products ?? []);
          setSource(data.source ?? "none");
          setFailed(false);
        } catch {
          if (cancelled) return;
          setFailed(true);
          setResults([]);
        }
      })();
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, query]);

  return { query, setQuery, results, source, failed };
}

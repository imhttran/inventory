"use client";

import { useCallback, useEffect, useState } from "react";
import { API_BASE, callApi, renewSessionFrom } from "@/lib/api";
import { PageHeader } from "@/components/PageHeader";
import { PageTitle } from "@/components/PageTitle";

type MeUser = {
  id: number;
  email: string;
  role: string;
  mustChangePassword?: boolean;
  hasProfile?: boolean;
};

type SearchHit = {
  id: string;
  sku: string;
  partNumber: string | null;
  name: string;
  brand: string;
  category: string;
  score: number;
};

type SearchResponse = {
  products: SearchHit[];
  source: "elasticsearch" | "postgres" | "none";
  message?: string;
};

const DEBOUNCE_MS = 300;

// Source label — the API serves from Elasticsearch when it's up and falls
// back to Postgres ILIKE otherwise; the badge makes the engine visible.
const SOURCE_LABEL: Record<SearchResponse["source"], string> = {
  elasticsearch: "via Elasticsearch",
  postgres: "via PostgreSQL (fallback)",
  none: "",
};

export default function SearchPage() {
  const [me, setMe] = useState<MeUser | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[] | null>(null);
  const [source, setSource] = useState<SearchResponse["source"]>("none");
  const [failed, setFailed] = useState(false);

  // Auth-on-mount, same gates as the dashboard (temp password, then profile).
  useEffect(() => {
    (async () => {
      const stored = localStorage.getItem("auth_token");
      if (!stored) {
        window.location.href = "/";
        return;
      }
      const result = await callApi<{ user: MeUser }>(
        stored,
        "/api/me",
        "GET",
        undefined,
        false,
      );
      if (!result) {
        localStorage.removeItem("auth_token");
        window.location.href = "/";
        return;
      }
      const user = result.user;
      if (user.mustChangePassword) {
        window.location.href = "/change-password";
        return;
      }
      if (!user.hasProfile) {
        window.location.href = "/profile";
        return;
      }
      setMe(user);
    })();
  }, []);

  const runSearch = useCallback(async (authToken: string, q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/search?q=${encodeURIComponent(q.trim())}`,
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      renewSessionFrom(response);
      const data = (await response.json()) as SearchResponse;
      if (!response.ok) throw new Error(data.message ?? "search failed");
      setResults(data.products ?? []);
      setSource(data.source ?? "none");
      setFailed(false);
    } catch {
      setFailed(true);
      setResults([]);
    }
  }, []);

  // Debounced live search — typing re-queries after a short pause.
  useEffect(() => {
    if (!me) return;
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) return;
    const timer = setTimeout(() => {
      void runSearch(authToken, query);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [me, query, runSearch]);

  return (
    <div className="dashboard-container wide">
      <PageTitle title="Search | Auto Parts" />
      <PageHeader
        title="Search"
        subtitle="Find parts by name, SKU, part number, brand, or category."
      >
        <a className="logout-link" href="/dashboard">
          Back to Dashboard
        </a>
      </PageHeader>

      <div className="dashboard-card">
        <div className="product-filters">
          <input
            type="search"
            placeholder="Search parts — e.g. brake pads, 210-0427, Bosch…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search parts"
            autoFocus
          />
          {results !== null && !failed && (
            <span className="search-source">{SOURCE_LABEL[source]}</span>
          )}
        </div>

        <div className="table-scroll">
          <table className="user-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Part #</th>
                <th>Name</th>
                <th>Brand</th>
                <th>Category</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {results === null ? (
                <tr>
                  <td colSpan={6}>
                    {me ? "Type to search the catalog." : "Loading…"}
                  </td>
                </tr>
              ) : failed ? (
                <tr>
                  <td colSpan={6}>Search failed. Is the backend running?</td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={6}>No parts match “{query}”.</td>
                </tr>
              ) : (
                results.map((hit) => (
                  <tr key={hit.id}>
                    <td>{hit.sku}</td>
                    <td>{hit.partNumber || "—"}</td>
                    <td>{hit.name}</td>
                    <td>{hit.brand}</td>
                    <td>{hit.category}</td>
                    <td>
                      <a href={`/products/${hit.id}`}>View</a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

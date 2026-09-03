"use client";

import { useEffect, useState } from "react";
import { callApi } from "@/lib/api";
import { usePartsSearch, SOURCE_LABEL } from "@/lib/usePartsSearch";
import { PageHeader } from "@/components/PageHeader";
import { PageTitle } from "@/components/PageTitle";
import { AppShell } from "@/components/AppShell";

type MeUser = {
  id: number;
  email: string;
  role: string;
  mustChangePassword?: boolean;
  hasProfile?: boolean;
};

export default function SearchPage() {
  const [me, setMe] = useState<MeUser | null>(null);
  const { query, setQuery, results, source, failed } = usePartsSearch(!!me);

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

  return (
    <AppShell>
      <div className="dashboard-container wide">
        <PageTitle title="Search | Auto Parts" />
        <PageHeader
          title="Search"
          subtitle="Find parts by name, SKU, part number, brand, or category."
        />

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
    </AppShell>
  );
}

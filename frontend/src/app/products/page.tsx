"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { API_BASE, callApi, renewSessionFrom } from "@/lib/api";
import { hasRole } from "@/lib/roles";
import { PageHeader } from "@/components/PageHeader";
import { PageTitle } from "@/components/PageTitle";

type MeUser = {
  id: number;
  email: string;
  role: string;
  mustChangePassword?: boolean;
  hasProfile?: boolean;
};

type Brand = { id: string; name: string; active: boolean };

type Category = {
  id: string;
  parentId: string | null;
  name: string;
  active: boolean;
};

type Product = {
  id: string;
  sku: string;
  partNumber: string | null;
  name: string;
  description: string | null;
  brandId: string;
  brand: string;
  categoryId: string;
  category: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type MutationResult = { success?: boolean; message?: string };

const PER_PAGE = 25;

// Shared by the create form and the "+ Brand"/"+ Category" buttons: posts JSON
// with the session token and returns the outcome with its message so the
// caller can alert it (the lib's callApi drops non-2xx response bodies).
async function sendJson(
  authToken: string,
  path: string,
  method: string,
  body: unknown,
): Promise<{ ok: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    renewSessionFrom(response);
    const data = (await response.json().catch(() => ({}))) as MutationResult;
    return {
      ok: response.ok,
      message: data.message ?? (response.ok ? "Done" : "Request failed"),
    };
  } catch {
    return { ok: false, message: "Connection error. Is the backend running?" };
  }
}

export default function ProductsPage() {
  const [me, setMe] = useState<MeUser | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(1);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [formBrandId, setFormBrandId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const addProductRef = useRef<HTMLDetailsElement>(null);

  const isStaff = me ? hasRole(me.role, "staff") : false;
  const canSubmitProduct = formBrandId !== "" && formCategoryId !== "";

  const loadProducts = useCallback(
    async (
      authToken: string,
      targetPage: number,
      search: string,
      brand: string,
      category: string,
    ) => {
      const params = new URLSearchParams();
      params.set("page", String(targetPage));
      params.set("perPage", String(PER_PAGE));
      if (search) params.set("q", search);
      if (brand) params.set("brand", brand);
      if (category) params.set("category", category);
      try {
        const response = await fetch(`${API_BASE}/api/v1/products?${params}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        renewSessionFrom(response);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setProducts(data.products ?? []);
        setTotal(data.total ?? 0);
        setPage(data.page ?? 1);
        setPageCount(Math.max(1, data.pageCount ?? 1));
        setFailed(false);
      } catch {
        setFailed(true);
      }
    },
    [],
  );

  // Returns the fresh lists so "+ New" can preselect what it just created.
  const loadLookups = useCallback(
    async (
      authToken: string,
    ): Promise<{ brands: Brand[]; categories: Category[] }> => {
      const [brandsRes, categoriesRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/brands`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch(`${API_BASE}/api/v1/categories`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);
      renewSessionFrom(brandsRes);
      renewSessionFrom(categoriesRes);
      const nextBrands: Brand[] = brandsRes.ok
        ? (((await brandsRes.json()) as { brands?: Brand[] }).brands ?? [])
        : [];
      const nextCategories: Category[] = categoriesRes.ok
        ? (((await categoriesRes.json()) as { categories?: Category[] })
            .categories ?? [])
        : [];
      setBrands(nextBrands);
      setCategories(nextCategories);
      return { brands: nextBrands, categories: nextCategories };
    },
    [],
  );

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
      await loadLookups(stored);
    })();
  }, [loadLookups]);

  // Debounce the search box so typing doesn't hammer the API.
  useEffect(() => {
    const timer = setTimeout(() => setQ(qInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [qInput]);

  // Any filter/page change re-fetches from the API (server-side paging).
  useEffect(() => {
    if (!me) return;
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) return;
    void loadProducts(authToken, page, q, brandFilter, categoryFilter);
  }, [me, page, q, brandFilter, categoryFilter, loadProducts]);

  const withToken = useCallback((run: (authToken: string) => Promise<void>) => {
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) return;
    void run(authToken);
  }, []);

  const changeFilter = (apply: () => void) => {
    apply();
    setPage(1);
  };

  const addLookup = (kind: "brands" | "categories") => {
    const label = kind === "brands" ? "brand" : "category";
    const name = window.prompt(`New ${label} name:`);
    if (!name || !name.trim()) return;
    void withToken(async (authToken) => {
      const result = await sendJson(authToken, `/api/v1/${kind}`, "POST", {
        name: name.trim(),
      });
      if (!result.ok) {
        alert(`Error: ${result.message}`);
        return;
      }
      const fresh = await loadLookups(authToken);
      const created =
        kind === "brands"
          ? fresh.brands.find((item) => item.name === name.trim())
          : fresh.categories.find((item) => item.name === name.trim());
      if (kind === "brands") {
        setFormBrandId(created ? String(created.id) : "");
      } else {
        setFormCategoryId(created ? String(created.id) : "");
      }
      alert(result.message);
    });
  };

  const handleAddProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    void (async () => {
      const result = await sendJson(authToken, "/api/v1/products", "POST", {
        sku: data.get("sku"),
        name: data.get("name"),
        partNumber: data.get("partNumber"),
        description: data.get("description"),
        brandId: formBrandId,
        categoryId: formCategoryId,
      });
      if (result.ok) {
        alert(result.message);
        form.reset();
        setFormBrandId("");
        setFormCategoryId("");
        if (addProductRef.current) addProductRef.current.open = false;
        setPage(1);
        await loadProducts(authToken, 1, q, brandFilter, categoryFilter);
      } else {
        alert(`Error: ${result.message}`);
      }
    })();
  };

  const clearFilters = () => {
    setQInput("");
    setQ("");
    setBrandFilter("");
    setCategoryFilter("");
    setPage(1);
  };

  // The table rows: null while loading, [] once loaded (or on failure — the
  // failed banner takes over).
  const list = products ?? [];

  return (
    <div className="dashboard-container wide">
      <PageTitle title="Products | Auto Parts" />
      <PageHeader title="Products" subtitle="Automotive parts catalog.">
        <a className="logout-link" href="/dashboard">
          Back to Dashboard
        </a>
      </PageHeader>

      {isStaff && (
        <div className="dashboard-card">
          <details ref={addProductRef}>
            <summary className="add-user-toggle">Add Product</summary>
            <form className="add-user-form" onSubmit={handleAddProduct}>
              <input type="text" name="sku" placeholder="SKU" required />
              <input type="text" name="name" placeholder="Name" required />
              <input
                type="text"
                name="partNumber"
                placeholder="Part number (MPN)"
              />
              <input type="text" name="description" placeholder="Description" />
              <select
                value={formBrandId}
                onChange={(event) => setFormBrandId(event.target.value)}
                aria-label="Brand"
              >
                <option value="">— No brand —</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="login-button"
                onClick={() => addLookup("brands")}
              >
                + Brand
              </button>
              <select
                value={formCategoryId}
                onChange={(event) => setFormCategoryId(event.target.value)}
                aria-label="Category"
              >
                <option value="">— No category —</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="login-button"
                onClick={() => addLookup("categories")}
              >
                + Category
              </button>
              <button
                type="submit"
                className="login-button"
                disabled={!canSubmitProduct}
              >
                Add Product
              </button>
            </form>
          </details>
        </div>
      )}

      <div className="dashboard-card">
        <div className="product-filters">
          <input
            type="search"
            placeholder="Search name, SKU, or part number…"
            value={qInput}
            onChange={(event) =>
              changeFilter(() => setQInput(event.target.value))
            }
            aria-label="Search products"
          />
          <select
            value={brandFilter}
            onChange={(event) =>
              changeFilter(() => setBrandFilter(event.target.value))
            }
            aria-label="Filter by brand"
          >
            <option value="">All brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.name}>
                {brand.name}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(event) =>
              changeFilter(() => setCategoryFilter(event.target.value))
            }
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
          <button type="button" className="login-button" onClick={clearFilters}>
            Clear
          </button>
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
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products === null && !failed ? (
                <tr>
                  <td colSpan={7}>Loading…</td>
                </tr>
              ) : failed ? (
                <tr>
                  <td colSpan={7}>
                    Failed to load products. Is the backend running?
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={7}>No products found.</td>
                </tr>
              ) : (
                list.map((product) => (
                  <tr key={product.id}>
                    <td>{product.sku}</td>
                    <td>{product.partNumber || "—"}</td>
                    <td>{product.name}</td>
                    <td>{product.brand}</td>
                    <td>{product.category}</td>
                    <td>{new Date(product.updatedAt).toLocaleDateString()}</td>
                    <td>
                      <a href={`/products/${product.id}`}>View</a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="product-meta">
          {total} product{total === 1 ? "" : "s"} · page {page} of {pageCount}
          <button
            type="button"
            className="login-button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Prev
          </button>
          <button
            type="button"
            className="login-button"
            disabled={page >= pageCount}
            onClick={() =>
              setPage((current) => Math.min(pageCount, current + 1))
            }
          >
            Next
          </button>
        </p>
      </div>
    </div>
  );
}

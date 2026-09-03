"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { API_BASE, callApi, renewSessionFrom } from "@/lib/api";
import { formKeys } from "@/lib/formKeys";
import { hasRole } from "@/lib/roles";
import { PageHeader } from "@/components/PageHeader";
import { PageTitle } from "@/components/PageTitle";
import { AppShell } from "@/components/AppShell";
import { Field } from "@/components/Field";
import { FormStatus, type FormStatusState } from "@/components/FormStatus";

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
  // Inline save result for the Add Product form.
  const [status, setStatus] = useState<FormStatusState>(null);
  // Bumped on open and after each add to remount a blank form.
  const [formNonce, setFormNonce] = useState(0);
  const addProductRef = useRef<HTMLDetailsElement>(null);
  const skuInputRef = useRef<HTMLInputElement>(null);

  const isStaff = me ? hasRole(me.role, "staff") : false;
  const canSubmitProduct = formBrandId !== "" && formCategoryId !== "";

  // After the form mounts open or remounts blank (reopen / post-add), put the
  // cursor in the SKU field — entry continues without a mouse. Skipped when
  // closed so focus is never stolen from the page.
  useEffect(() => {
    if (addProductRef.current?.open) skuInputRef.current?.focus();
  }, [formNonce]);

  const closeForm = () => {
    if (addProductRef.current) addProductRef.current.open = false;
    addProductRef.current?.querySelector("summary")?.focus();
  };

  // Reopening always starts blank, including the brand/category selects.
  const handleToggle = () => {
    if (!addProductRef.current?.open) return;
    setFormNonce((n) => n + 1);
    setFormBrandId("");
    setFormCategoryId("");
    setStatus(null);
  };

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
    const data = new FormData(event.currentTarget);
    void (async () => {
      const result = await sendJson(authToken, "/api/v1/products", "POST", {
        sku: data.get("sku"),
        name: data.get("name"),
        partNumber: data.get("partNumber"),
        description: data.get("description"),
        brandId: formBrandId,
        categoryId: formCategoryId,
        retailPrice: String(data.get("retailPrice") ?? "").trim() || undefined,
      });
      if (result.ok) {
        // Batch entry: stay open, blank the form, cursor back on SKU.
        setStatus({ kind: "ok", text: result.message });
        setFormBrandId("");
        setFormCategoryId("");
        setFormNonce((n) => n + 1);
        setPage(1);
        await loadProducts(authToken, 1, q, brandFilter, categoryFilter);
      } else {
        setStatus({ kind: "error", text: `Error: ${result.message}` });
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
    <AppShell>
      <div className="dashboard-container wide">
        <PageTitle title="Products | Auto Parts" />
        <PageHeader title="Products" subtitle="Automotive parts catalog." />

        {isStaff && (
          <div className="dashboard-card">
            <details ref={addProductRef} onToggle={handleToggle}>
              <summary className="add-user-toggle">Add Product</summary>
              <form
                key={`new-${formNonce}`}
                className="add-user-form entry-form"
                onSubmit={handleAddProduct}
                onKeyDown={formKeys(closeForm)}
              >
                <p className="form-hint">
                  Enter moves to the next field; Enter on the last field saves.
                  Esc closes.
                </p>
                <div className="field-grid">
                  <Field label="SKU" span={2}>
                    <input
                      ref={skuInputRef}
                      type="text"
                      name="sku"
                      placeholder="SKU"
                      autoComplete="off"
                      required
                    />
                  </Field>
                  <Field label="Name" span={2}>
                    <input
                      type="text"
                      name="name"
                      placeholder="Name"
                      autoComplete="off"
                      required
                    />
                  </Field>
                  <Field label="Part number (MPN)" span={2}>
                    <input
                      type="text"
                      name="partNumber"
                      placeholder="Part number (MPN)"
                      autoComplete="off"
                    />
                  </Field>
                  <Field label="Retail price" span={2}>
                    <input
                      type="text"
                      name="retailPrice"
                      placeholder="Retail price"
                      inputMode="decimal"
                      autoComplete="off"
                    />
                  </Field>
                  <Field label="Description" span={4}>
                    <input
                      type="text"
                      name="description"
                      placeholder="Description"
                      autoComplete="off"
                    />
                  </Field>
                  <Field label="Brand" span={2}>
                    <div className="field-row">
                      <select
                        value={formBrandId}
                        onChange={(event) => setFormBrandId(event.target.value)}
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
                    </div>
                  </Field>
                  <Field label="Category" span={2}>
                    <div className="field-row">
                      <select
                        value={formCategoryId}
                        onChange={(event) =>
                          setFormCategoryId(event.target.value)
                        }
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
                    </div>
                  </Field>
                </div>
                <div className="form-actions">
                  <button
                    type="submit"
                    className="login-button"
                    disabled={!canSubmitProduct}
                  >
                    Add Product
                  </button>
                </div>
              </form>
            </details>
            <FormStatus status={status} />
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
            <button
              type="button"
              className="login-button"
              onClick={clearFilters}
            >
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
                      <td>
                        {new Date(product.updatedAt).toLocaleDateString()}
                      </td>
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
    </AppShell>
  );
}

"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { API_BASE, callApi, renewSessionFrom } from "@/lib/api";
import { hasRole } from "@/lib/roles";
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
  retailPrice: string | null;
  createdAt: string;
  updatedAt: string;
};

type SourcingRow = {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string | null;
  supplierPartNumber: string | null;
  cost: string | null;
  minimumOrderQuantity: number;
  leadTimeDays: number | null;
  preferred: boolean;
  active: boolean;
};

type SourcingEntry = {
  supplierId: string;
  supplierPartNumber: string;
  cost: string;
  minimumOrderQuantity: string;
  leadTimeDays: string;
  preferred: boolean;
};

type SupplierLite = { id: string; name: string; active: boolean };

type MutationResult = { success?: boolean; message?: string };

// Same shape as the list page's sendJson: surfaces non-2xx bodies, which the
// lib's callApi would swallow.
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

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [me, setMe] = useState<MeUser | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [failed, setFailed] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editBrandId, setEditBrandId] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");

  const [sourcing, setSourcing] = useState<SourcingRow[] | null>(null);
  const [draftSourcing, setDraftSourcing] = useState<SourcingEntry[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierLite[]>([]);

  const isAdmin = me ? hasRole(me.role, "admin") : false;
  const isStaff = me ? hasRole(me.role, "staff") : false;

  const loadProduct = useCallback(
    async (authToken: string) => {
      if (!id) return;
      try {
        const response = await fetch(`${API_BASE}/api/v1/products/${id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        renewSessionFrom(response);
        if (response.status === 404) {
          setNotFound(true);
          return;
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        const loaded = data.product as Product | undefined;
        setProduct(loaded ?? null);
        setEditBrandId(loaded ? String(loaded.brandId) : "");
        setEditCategoryId(loaded ? String(loaded.categoryId) : "");
        setFailed(false);
      } catch {
        setFailed(true);
      }
    },
    [id],
  );

  const loadLookups = useCallback(async (authToken: string) => {
    const [brandsRes, categoriesRes, suppliersRes] = await Promise.all([
      fetch(`${API_BASE}/api/v1/brands`, {
        headers: { Authorization: `Bearer ${authToken}` },
      }),
      fetch(`${API_BASE}/api/v1/categories`, {
        headers: { Authorization: `Bearer ${authToken}` },
      }),
      fetch(`${API_BASE}/api/v1/suppliers`, {
        headers: { Authorization: `Bearer ${authToken}` },
      }),
    ]);
    renewSessionFrom(brandsRes);
    renewSessionFrom(categoriesRes);
    renewSessionFrom(suppliersRes);
    if (brandsRes.ok) {
      setBrands(
        ((await brandsRes.json()) as { brands?: Brand[] }).brands ?? [],
      );
    }
    if (categoriesRes.ok) {
      setCategories(
        ((await categoriesRes.json()) as { categories?: Category[] })
          .categories ?? [],
      );
    }
    if (suppliersRes.ok) {
      setSuppliers(
        ((await suppliersRes.json()) as { suppliers?: SupplierLite[] })
          .suppliers ?? [],
      );
    }
  }, []);

  const loadSourcing = useCallback(
    async (authToken: string) => {
      if (!id) return;
      try {
        const response = await fetch(
          `${API_BASE}/api/v1/products/${id}/suppliers`,
          { headers: { Authorization: `Bearer ${authToken}` } },
        );
        renewSessionFrom(response);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        const rows = (data.sourcing ?? []) as SourcingRow[];
        setSourcing(rows);
        setDraftSourcing(
          rows.map((row) => ({
            supplierId: row.supplierId,
            supplierPartNumber: row.supplierPartNumber ?? "",
            cost: row.cost ?? "",
            minimumOrderQuantity: String(row.minimumOrderQuantity),
            leadTimeDays:
              row.leadTimeDays == null ? "" : String(row.leadTimeDays),
            preferred: row.preferred,
          })),
        );
      } catch {
        setSourcing([]);
        setDraftSourcing([]);
      }
    },
    [id],
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
      await Promise.all([
        loadProduct(stored),
        loadLookups(stored),
        loadSourcing(stored),
      ]);
    })();
  }, [loadProduct, loadLookups, loadSourcing]);

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id) return;
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) return;
    const data = new FormData(event.currentTarget);
    void (async () => {
      const result = await sendJson(
        authToken,
        `/api/v1/products/${id}`,
        "PUT",
        {
          sku: data.get("sku"),
          name: data.get("name"),
          partNumber: data.get("partNumber"),
          description: data.get("description"),
          brandId: editBrandId,
          categoryId: editCategoryId,
          retailPrice:
            String(data.get("retailPrice") ?? "").trim() || undefined,
        },
      );
      if (result.ok) {
        alert(result.message);
        await loadProduct(authToken);
      } else {
        alert(`Error: ${result.message}`);
      }
    })();
  };

  const handleDelete = () => {
    if (!id) return;
    if (!window.confirm("Delete this product?")) return;
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) return;
    void (async () => {
      const result = await sendJson(
        authToken,
        `/api/v1/products/${id}`,
        "DELETE",
        undefined,
      );
      if (result.ok) {
        window.location.href = "/products";
      } else {
        alert(`Error: ${result.message}`);
      }
    })();
  };

  const updateDraft = (index: number, patch: Partial<SourcingEntry>) => {
    setDraftSourcing((current) =>
      current.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    );
  };

  const handleSaveSourcing = () => {
    if (!id) return;
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) return;
    void (async () => {
      const result = await sendJson(
        authToken,
        `/api/v1/products/${id}/suppliers`,
        "PUT",
        {
          sourcing: draftSourcing.map((entry) => ({
            supplierId: entry.supplierId,
            supplierPartNumber: entry.supplierPartNumber,
            ...(entry.cost.trim() ? { cost: entry.cost.trim() } : {}),
            ...(entry.minimumOrderQuantity.trim()
              ? { minimumOrderQuantity: Number(entry.minimumOrderQuantity) }
              : {}),
            ...(entry.leadTimeDays.trim()
              ? { leadTimeDays: Number(entry.leadTimeDays) }
              : {}),
            preferred: entry.preferred,
          })),
        },
      );
      if (result.ok) {
        alert(result.message);
        await loadSourcing(authToken);
      } else {
        alert(`Error: ${result.message}`);
      }
    })();
  };

  return (
    <AppShell>
      <div className="dashboard-container">
        <PageTitle
          title={
            product ? `${product.name} | Auto Parts` : "Product | Auto Parts"
          }
        />
        <PageHeader
          title={product ? product.name : "Product"}
          subtitle={product ? `SKU ${product.sku}` : "Product details"}
        />

        {notFound ? (
          <div className="dashboard-card">
            <p>Product not found.</p>
          </div>
        ) : failed ? (
          <div className="dashboard-card">
            <p>Could not load this product. Is the backend running?</p>
          </div>
        ) : product === null ? (
          <div className="dashboard-card">
            <p>Loading…</p>
          </div>
        ) : (
          <>
            <div className="dashboard-card">
              <p>
                <strong>SKU:</strong> {product.sku}
              </p>
              <p>
                <strong>Part number:</strong> {product.partNumber || "—"}
              </p>
              <p>
                <strong>Retail price:</strong>{" "}
                {product.retailPrice
                  ? `$${Number(product.retailPrice).toFixed(2)}`
                  : "—"}
              </p>
              <p>
                <strong>Brand:</strong> {product.brand}
              </p>
              <p>
                <strong>Category:</strong> {product.category}
              </p>
              <p>
                <strong>Description:</strong> {product.description || "—"}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(product.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Updated:</strong>{" "}
                {new Date(product.updatedAt).toLocaleString()}
              </p>
              {isAdmin && (
                <p>
                  <button
                    type="button"
                    className="logout-link"
                    onClick={handleDelete}
                  >
                    Delete Product
                  </button>
                </p>
              )}
            </div>

            <div className="dashboard-card">
              <h2>Sourcing</h2>
              {sourcing !== null && sourcing.length > 0 && (
                <div className="table-scroll">
                  <table className="user-table">
                    <thead>
                      <tr>
                        <th>Supplier</th>
                        <th>Part number</th>
                        <th>Cost</th>
                        <th>MOQ</th>
                        <th>Lead days</th>
                        <th>Preferred</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sourcing.map((row) => (
                        <tr key={row.id}>
                          <td>
                            {row.supplierName}
                            {row.supplierCode ? ` (${row.supplierCode})` : ""}
                          </td>
                          <td>{row.supplierPartNumber || "—"}</td>
                          <td>
                            {row.cost == null
                              ? "—"
                              : `$${Number(row.cost).toFixed(2)}`}
                          </td>
                          <td>{row.minimumOrderQuantity}</td>
                          <td>{row.leadTimeDays ?? "—"}</td>
                          <td>{row.preferred ? "Yes" : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {sourcing !== null && sourcing.length === 0 && (
                <p>No suppliers linked to this product yet.</p>
              )}
              {isStaff && (
                <details>
                  <summary className="add-user-toggle">Edit Sourcing</summary>
                  <div className="add-user-form">
                    {draftSourcing.map((entry, index) => (
                      <div key={index} className="sourcing-row">
                        <select
                          value={entry.supplierId}
                          onChange={(event) =>
                            updateDraft(index, {
                              supplierId: event.target.value,
                            })
                          }
                          aria-label="Supplier"
                        >
                          <option value="">— Supplier —</option>
                          {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Part number"
                          value={entry.supplierPartNumber}
                          onChange={(event) =>
                            updateDraft(index, {
                              supplierPartNumber: event.target.value,
                            })
                          }
                          aria-label="Supplier part number"
                        />
                        <input
                          type="number"
                          placeholder="Cost"
                          min="0"
                          step="0.01"
                          value={entry.cost}
                          onChange={(event) =>
                            updateDraft(index, { cost: event.target.value })
                          }
                          aria-label="Cost"
                        />
                        <input
                          type="number"
                          placeholder="MOQ"
                          min="1"
                          value={entry.minimumOrderQuantity}
                          onChange={(event) =>
                            updateDraft(index, {
                              minimumOrderQuantity: event.target.value,
                            })
                          }
                          aria-label="Minimum order quantity"
                        />
                        <input
                          type="number"
                          placeholder="Lead days"
                          min="0"
                          value={entry.leadTimeDays}
                          onChange={(event) =>
                            updateDraft(index, {
                              leadTimeDays: event.target.value,
                            })
                          }
                          aria-label="Lead time days"
                        />
                        <label className="sourcing-preferred">
                          <input
                            type="checkbox"
                            checked={entry.preferred}
                            onChange={(event) =>
                              setDraftSourcing((current) =>
                                current.map((row, i) =>
                                  i === index
                                    ? {
                                        ...row,
                                        preferred: event.target.checked,
                                      }
                                    : event.target.checked
                                      ? { ...row, preferred: false }
                                      : row,
                                ),
                              )
                            }
                          />{" "}
                          Preferred
                        </label>
                        <button
                          type="button"
                          className="logout-link"
                          onClick={() =>
                            setDraftSourcing((current) =>
                              current.filter((_, i) => i !== index),
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="login-button"
                      onClick={() =>
                        setDraftSourcing((current) => [
                          ...current,
                          {
                            supplierId: "",
                            supplierPartNumber: "",
                            cost: "",
                            minimumOrderQuantity: "1",
                            leadTimeDays: "",
                            preferred: current.length === 0,
                          },
                        ])
                      }
                    >
                      + Supplier
                    </button>
                    <button
                      type="button"
                      className="login-button"
                      disabled={draftSourcing.length === 0}
                      onClick={handleSaveSourcing}
                    >
                      Save Sourcing
                    </button>
                  </div>
                </details>
              )}
            </div>

            {isStaff && (
              <div className="dashboard-card">
                <details>
                  <summary className="add-user-toggle">Edit Product</summary>
                  {/* key: defaults must re-seed from the reloaded product after
                    a successful save, so remount on updatedAt. */}
                  <form
                    key={`${product.id}-${product.updatedAt}`}
                    className="add-user-form"
                    onSubmit={handleUpdate}
                  >
                    <input
                      type="text"
                      name="sku"
                      defaultValue={product.sku}
                      required
                    />
                    <input
                      type="text"
                      name="name"
                      defaultValue={product.name}
                      required
                    />
                    <input
                      type="text"
                      name="partNumber"
                      defaultValue={product.partNumber ?? ""}
                      placeholder="Part number (MPN)"
                    />
                    <input
                      type="text"
                      name="retailPrice"
                      defaultValue={product.retailPrice ?? ""}
                      placeholder="Retail price"
                      inputMode="decimal"
                    />
                    <input
                      type="text"
                      name="description"
                      defaultValue={product.description ?? ""}
                      placeholder="Description"
                    />
                    <select
                      value={editBrandId}
                      onChange={(event) => setEditBrandId(event.target.value)}
                      aria-label="Brand"
                    >
                      <option value="">— No brand —</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={editCategoryId}
                      onChange={(event) =>
                        setEditCategoryId(event.target.value)
                      }
                      aria-label="Category"
                    >
                      <option value="">— No category —</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="login-button">
                      Save Changes
                    </button>
                  </form>
                </details>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

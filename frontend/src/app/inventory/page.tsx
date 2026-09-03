"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
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

type InventoryRow = {
  id: string;
  productId: string;
  warehouseLocationId: string;
  productSku: string;
  productName: string;
  warehouseCode: string;
  warehouseName: string;
  locationCode: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityDamaged: number;
  createdAt: string;
  updatedAt: string;
};

type Warehouse = { id: string; code: string; name: string };

type WarehouseLocation = {
  id: string;
  warehouseId: string;
  code: string;
};

type ProductLite = { id: string; sku: string; name: string };

type Transaction = {
  id: string;
  transactionType: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  notes: string | null;
  createdByEmail: string | null;
  createdAt: string;
  warehouseCode: string | null;
  locationCode: string | null;
};

type MutationResult = { success?: boolean; message?: string };

const PER_PAGE = 25;
// The pickers load the first page of products; a distributor catalog outgrows
// a <select> — the product filter on /products is the search surface until a
// dedicated picker arrives.
const PICKER_LIMIT = 100;

const ADJUST_TYPES = [
  ["SALE", "Sale"],
  ["RETURN", "Return"],
  ["ADJUSTMENT", "Adjustment (signed)"],
  ["DAMAGE", "Damage"],
  ["LOST", "Lost"],
] as const;

// Shared by every stock mutation form: posts JSON with the session token and
// returns the outcome with its message (the lib's callApi drops non-2xx bodies).
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

type WarehouseGroup = {
  warehouse: Warehouse;
  locations: WarehouseLocation[];
};

// Bin picker grouped by warehouse — transfer and adjust need cross-warehouse
// reach without a separate page.
function LocationSelect({
  groups,
  value,
  onChange,
  label,
}: {
  groups: WarehouseGroup[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
    >
      <option value="">— Bin —</option>
      {groups.map(({ warehouse, locations }) => (
        <optgroup
          key={warehouse.id}
          label={`${warehouse.code} · ${warehouse.name}`}
        >
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.code}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function ProductSelect({
  products,
  value,
  onChange,
  label,
}: {
  products: ProductLite[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
    >
      <option value="">— Product —</option>
      {products.map((product) => (
        <option key={product.id} value={product.id}>
          {product.sku} · {product.name}
        </option>
      ))}
    </select>
  );
}

export default function InventoryPage() {
  const [me, setMe] = useState<MeUser | null>(null);
  const [stock, setStock] = useState<InventoryRow[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(1);
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");

  const [products, setProducts] = useState<ProductLite[]>([]);
  const [warehouseGroups, setWarehouseGroups] = useState<WarehouseGroup[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // One product picker shared by all three forms: pick a part, then act on it.
  const [pickerProductId, setPickerProductId] = useState("");
  const [receiveLocationId, setReceiveLocationId] = useState("");
  const [adjustLocationId, setAdjustLocationId] = useState("");
  const [adjustType, setAdjustType] = useState<string>("SALE");
  const [transferFromId, setTransferFromId] = useState("");
  const [transferToId, setTransferToId] = useState("");

  const [ledger, setLedger] = useState<Transaction[] | null>(null);
  const [ledgerProductId, setLedgerProductId] = useState("");

  const isStaff = me ? hasRole(me.role, "staff") : false;

  const loadStock = useCallback(
    async (
      authToken: string,
      targetPage: number,
      productId: string,
      warehouseId: string,
    ) => {
      const params = new URLSearchParams();
      params.set("page", String(targetPage));
      params.set("perPage", String(PER_PAGE));
      if (productId) params.set("productId", productId);
      if (warehouseId) params.set("warehouseId", warehouseId);
      try {
        const response = await fetch(`${API_BASE}/api/v1/inventory?${params}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        renewSessionFrom(response);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setStock(data.inventory ?? []);
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

  const loadLedger = useCallback(
    async (authToken: string, productId: string) => {
      try {
        const response = await fetch(
          `${API_BASE}/api/v1/inventory/${productId}/transactions`,
          { headers: { Authorization: `Bearer ${authToken}` } },
        );
        renewSessionFrom(response);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setLedger(data.transactions ?? []);
        setLedgerProductId(productId);
      } catch {
        setLedger([]);
        setLedgerProductId(productId);
      }
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

      // Pickers for the staff forms: products (first page), then every
      // warehouse's bins.
      const [productsRes, warehousesRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/products?perPage=${PICKER_LIMIT}`, {
          headers: { Authorization: `Bearer ${stored}` },
        }),
        fetch(`${API_BASE}/api/v1/warehouses`, {
          headers: { Authorization: `Bearer ${stored}` },
        }),
      ]);
      renewSessionFrom(productsRes);
      renewSessionFrom(warehousesRes);
      if (productsRes.ok) {
        setProducts(
          (
            ((await productsRes.json()) as { products?: ProductLite[] })
              .products ?? []
          ).map((product) => ({
            id: product.id,
            sku: product.sku,
            name: product.name,
          })),
        );
      }
      const nextWarehouses: Warehouse[] = warehousesRes.ok
        ? (((await warehousesRes.json()) as { warehouses?: Warehouse[] })
            .warehouses ?? [])
        : [];
      setWarehouses(nextWarehouses);
      const groups = await Promise.all(
        nextWarehouses.map(async (warehouse) => {
          const response = await fetch(
            `${API_BASE}/api/v1/warehouses/${warehouse.id}/locations`,
            { headers: { Authorization: `Bearer ${stored}` } },
          );
          renewSessionFrom(response);
          const locations = response.ok
            ? (((await response.json()) as { locations?: WarehouseLocation[] })
                .locations ?? [])
            : [];
          return { warehouse, locations };
        }),
      );
      setWarehouseGroups(groups);
    })();
  }, []);

  // Debounce-free: filter changes are explicit selects; page changes re-fetch.
  useEffect(() => {
    if (!me) return;
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) return;
    void loadStock(authToken, page, productFilter, warehouseFilter);
  }, [me, page, productFilter, warehouseFilter, loadStock]);

  const withToken = useCallback((run: (authToken: string) => Promise<void>) => {
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) return;
    void run(authToken);
  }, []);

  const refresh = () => {
    withToken(async (authToken) => {
      await loadStock(authToken, page, productFilter, warehouseFilter);
      if (ledgerProductId) await loadLedger(authToken, ledgerProductId);
    });
  };

  const handleReceive = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const quantity = Number(data.get("quantity"));
    withToken(async (authToken) => {
      const result = await sendJson(
        authToken,
        "/api/v1/inventory/receive",
        "POST",
        {
          productId: pickerProductId,
          warehouseLocationId: receiveLocationId,
          quantity,
          notes: data.get("notes"),
        },
      );
      if (result.ok) {
        alert(result.message);
        setReceiveLocationId("");
        refresh();
      } else {
        alert(`Error: ${result.message}`);
      }
    });
  };

  const handleAdjust = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    withToken(async (authToken) => {
      const result = await sendJson(
        authToken,
        "/api/v1/inventory/adjust",
        "POST",
        {
          productId: pickerProductId,
          warehouseLocationId: adjustLocationId,
          transactionType: adjustType,
          quantity: Number(data.get("quantity")),
          notes: data.get("notes"),
        },
      );
      if (result.ok) {
        alert(result.message);
        setAdjustLocationId("");
        refresh();
      } else {
        alert(`Error: ${result.message}`);
      }
    });
  };

  const handleTransfer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    withToken(async (authToken) => {
      const result = await sendJson(
        authToken,
        "/api/v1/inventory/transfer",
        "POST",
        {
          productId: pickerProductId,
          fromWarehouseLocationId: transferFromId,
          toWarehouseLocationId: transferToId,
          quantity: Number(data.get("quantity")),
          notes: data.get("notes"),
        },
      );
      if (result.ok) {
        alert(result.message);
        setTransferFromId("");
        setTransferToId("");
        refresh();
      } else {
        alert(`Error: ${result.message}`);
      }
    });
  };

  // Stock rows for the table: null while loading; the failed banner takes
  // over on failure.
  const rows = stock ?? [];

  const toggleLedger = (productId: string) => {
    if (ledgerProductId === productId) {
      setLedgerProductId("");
      setLedger(null);
      return;
    }
    withToken(async (authToken) => loadLedger(authToken, productId));
  };

  return (
    <div className="dashboard-container wide">
      <PageTitle title="Inventory | Auto Parts" />
      <PageHeader title="Inventory" subtitle="Stock on hand by warehouse bin.">
        <a className="logout-link" href="/dashboard">
          Back to Dashboard
        </a>
      </PageHeader>

      {isStaff && (
        <div className="dashboard-card">
          <details>
            <summary className="add-user-toggle">Receive Stock</summary>
            <form className="add-user-form" onSubmit={handleReceive}>
              <ProductSelect
                products={products}
                value={pickerProductId}
                onChange={setPickerProductId}
                label="Product"
              />
              <LocationSelect
                groups={warehouseGroups}
                value={receiveLocationId}
                onChange={setReceiveLocationId}
                label="Destination bin"
              />
              <input
                type="number"
                name="quantity"
                placeholder="Quantity"
                min="1"
                required
              />
              <input
                type="text"
                name="notes"
                placeholder="Reference (PO, notes)"
              />
              <button
                type="submit"
                className="login-button"
                disabled={!pickerProductId || !receiveLocationId}
              >
                Receive
              </button>
            </form>
          </details>
          <details>
            <summary className="add-user-toggle">Adjust Stock</summary>
            <form className="add-user-form" onSubmit={handleAdjust}>
              <ProductSelect
                products={products}
                value={pickerProductId}
                onChange={setPickerProductId}
                label="Product"
              />
              <LocationSelect
                groups={warehouseGroups}
                value={adjustLocationId}
                onChange={setAdjustLocationId}
                label="Bin"
              />
              <select
                value={adjustType}
                onChange={(event) => setAdjustType(event.target.value)}
                aria-label="Adjustment type"
              >
                {ADJUST_TYPES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="quantity"
                placeholder="Quantity"
                min={adjustType === "ADJUSTMENT" ? undefined : 1}
                required
              />
              <input type="text" name="notes" placeholder="Reason" />
              <button
                type="submit"
                className="login-button"
                disabled={!pickerProductId || !adjustLocationId}
              >
                Adjust
              </button>
            </form>
          </details>
          <details>
            <summary className="add-user-toggle">Transfer Stock</summary>
            <form className="add-user-form" onSubmit={handleTransfer}>
              <ProductSelect
                products={products}
                value={pickerProductId}
                onChange={setPickerProductId}
                label="Product"
              />
              <LocationSelect
                groups={warehouseGroups}
                value={transferFromId}
                onChange={setTransferFromId}
                label="From bin"
              />
              <LocationSelect
                groups={warehouseGroups}
                value={transferToId}
                onChange={setTransferToId}
                label="To bin"
              />
              <input
                type="number"
                name="quantity"
                placeholder="Quantity"
                min="1"
                required
              />
              <input type="text" name="notes" placeholder="Notes" />
              <button
                type="submit"
                className="login-button"
                disabled={!pickerProductId || !transferFromId || !transferToId}
              >
                Transfer
              </button>
            </form>
          </details>
        </div>
      )}

      <div className="dashboard-card">
        <div className="product-filters">
          <select
            value={warehouseFilter}
            onChange={(event) => {
              setWarehouseFilter(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by warehouse"
          >
            <option value="">All warehouses</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.code} · {warehouse.name}
              </option>
            ))}
          </select>
          <select
            value={productFilter}
            onChange={(event) => {
              setProductFilter(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by product"
          >
            <option value="">All products</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.sku} · {product.name}
              </option>
            ))}
          </select>
        </div>

        <div className="table-scroll">
          <table className="user-table">
            <thead>
              <tr>
                <th>Warehouse</th>
                <th>Bin</th>
                <th>Product</th>
                <th>On hand</th>
                <th>Reserved</th>
                <th>Damaged</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {stock === null && !failed ? (
                <tr>
                  <td colSpan={8}>Loading…</td>
                </tr>
              ) : failed ? (
                <tr>
                  <td colSpan={8}>
                    Failed to load stock. Is the backend running?
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8}>No stock recorded yet.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {row.warehouseCode} · {row.warehouseName}
                    </td>
                    <td>{row.locationCode}</td>
                    <td>
                      {row.productSku} — {row.productName}
                    </td>
                    <td>{row.quantityOnHand}</td>
                    <td>{row.quantityReserved}</td>
                    <td>{row.quantityDamaged}</td>
                    <td>{new Date(row.updatedAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        type="button"
                        className="logout-link"
                        onClick={() => toggleLedger(row.productId)}
                      >
                        {ledgerProductId === row.productId ? "Hide" : "Ledger"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="product-meta">
          {total} stock record{total === 1 ? "" : "s"} · page {page} of{" "}
          {pageCount}
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

      {ledger !== null && (
        <div className="dashboard-card">
          <h2>Movement history</h2>
          <div className="table-scroll">
            <table className="user-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Before → After</th>
                  <th>Bin</th>
                  <th>By</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No movements recorded.</td>
                  </tr>
                ) : (
                  ledger.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        {new Date(transaction.createdAt).toLocaleString()}
                      </td>
                      <td>{transaction.transactionType}</td>
                      <td>
                        {transaction.quantity > 0 ? "+" : ""}
                        {transaction.quantity}
                      </td>
                      <td>
                        {transaction.quantityBefore} →{" "}
                        {transaction.quantityAfter}
                      </td>
                      <td>
                        {transaction.warehouseCode
                          ? `${transaction.warehouseCode} · ${transaction.locationCode}`
                          : "—"}
                      </td>
                      <td>{transaction.createdByEmail ?? "—"}</td>
                      <td>{transaction.notes || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

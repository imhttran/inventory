"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE, callApi, renewSessionFrom } from "@/lib/api";
import { hasRole } from "@/lib/roles";
import { PageTitle } from "@/components/PageTitle";
import { PageHeader } from "@/components/PageHeader";
import { PageFooter } from "@/components/PageFooter";
import { AppShell } from "@/components/AppShell";

type MeUser = {
  id: number;
  email: string;
  role: string;
  mustChangePassword?: boolean;
  hasProfile?: boolean;
};

type Product = {
  id: string;
  sku: string;
  partNumber: string | null;
  name: string;
  category: string;
  retailPrice: string | null;
};

type InventoryRow = {
  productId: string;
  warehouseLocationId: string;
  locationCode: string;
  quantityOnHand: number;
  quantityDamaged: number;
};

type Category = { id: string; name: string };

type CartLine = {
  productId: string;
  sku: string;
  name: string;
  price: number;
  binId: string;
  binCode: string;
  qty: number;
};

type MutationResult = { success?: boolean; message?: string };

const SEARCH_PAGE = 25;
const TAX_RATE = 0.0825;

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

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

export default function SalePage() {
  const [me, setMe] = useState<MeUser | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stockByProduct, setStockByProduct] = useState<Map<string, InventoryRow[]>>(new Map());
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [failed, setFailed] = useState(false);
  const [chargeError, setChargeError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastSale, setLastSale] = useState<string | null>(null);

  const isStaff = me ? hasRole(me.role, "staff") : false;

  const loadProducts = useCallback(async (search: string) => {
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) return;
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(
          `${API_BASE}/api/v1/products?perPage=${SEARCH_PAGE}` +
            (search ? `&q=${encodeURIComponent(search)}` : ""),
          { headers: { Authorization: `Bearer ${authToken}` } },
        ),
        fetch(`${API_BASE}/api/v1/categories`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);
      [productsRes, categoriesRes].forEach(renewSessionFrom);
      if (!productsRes.ok) throw new Error("products");
      const productsData = await productsRes.json();
      setProducts(productsData.products ?? []);
      const categoriesData = await categoriesRes.json().catch(() => ({}));
      setCategories(categoriesData.categories ?? []);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  const loadStock = useCallback(async () => {
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) return;
    try {
      const response = await fetch(`${API_BASE}/api/v1/inventory?perPage=100`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      renewSessionFrom(response);
      const data = await response.json();
      if (!response.ok) throw new Error("inventory");
      const rows: InventoryRow[] = data.inventory ?? [];
      const map = new Map<string, InventoryRow[]>();
      for (const row of rows) {
        const list = map.get(row.productId) ?? [];
        list.push(row);
        map.set(row.productId, list);
      }
      setStockByProduct(map);
    } catch {
      // Stock is display + pick-bin info; lookup still works without it.
      setStockByProduct(new Map());
    }
  }, []);

  // Auth-on-mount, same gates as the dashboard.
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

  useEffect(() => {
    if (me) {
      void loadProducts(q);
      void loadStock();
    }
  }, [me, q, loadProducts, loadStock]);

  // Debounce the search box so typing doesn't hammer the API.
  useEffect(() => {
    const timer = setTimeout(() => setQ(qInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [qInput]);

  // Best pick bin: the one holding the most on-hand units.
  const bestBin = useMemo(() => {
    const bins = new Map<string, { binId: string; binCode: string; onHand: number; damaged: number }>();
    stockByProduct.forEach((rows, productId) => {
      const best = [...rows].sort((a, b) => b.quantityOnHand - a.quantityOnHand)[0];
      if (!best) return;
      bins.set(productId, {
        binId: best.warehouseLocationId,
        binCode: best.locationCode,
        onHand: rows.reduce((sum, r) => sum + r.quantityOnHand, 0),
        damaged: rows.reduce((sum, r) => sum + r.quantityDamaged, 0),
      });
    });
    return bins;
  }, [stockByProduct]);

  const visible = (products ?? []).filter((p) => {
    if (!categoryFilter) return true;
    return p.category === categoryFilter;
  });

  const addToCart = (product: Product) => {
    const bin = bestBin.get(product.id);
    const price = product.retailPrice === null ? null : Number(product.retailPrice);
    if (!bin || price === null || Number.isNaN(price)) return;
    setChargeError(null);
    setLastSale(null);
    setCart((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing) {
        return current.map((line) =>
          line.productId === product.id ? { ...line, qty: line.qty + 1 } : line,
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          sku: product.sku,
          name: product.name,
          price,
          binId: bin.binId,
          binCode: bin.binCode,
          qty: 1,
        },
      ];
    });
  };

  const changeQty = (productId: string, delta: number) => {
    setCart((current) =>
      current
        .map((line) =>
          line.productId === productId ? { ...line, qty: Math.max(0, line.qty + delta) } : line,
        )
        .filter((line) => line.qty > 0),
    );
  };

  const subtotal = cart.reduce((sum, line) => sum + line.price * line.qty, 0);
  const tax = subtotal * TAX_RATE;
  const grand = subtotal + tax;
  const itemCount = cart.reduce((sum, line) => sum + line.qty, 0);

  const charge = async () => {
    const authToken = localStorage.getItem("auth_token");
    if (!authToken || !isStaff || cart.length === 0) return;
    setBusy(true);
    setChargeError(null);
    let sold = 0;
    for (const line of cart) {
      const result = await sendJson(
        authToken,
        "/api/v1/inventory/adjust",
        "POST",
        {
          productId: line.productId,
          warehouseLocationId: line.binId,
          transactionType: "SALE",
          quantity: line.qty,
          notes: `Counter sale · ${line.sku} ×${line.qty} · bin ${line.binCode}`,
        },
      );
      if (!result.ok) {
        setChargeError(
          `${line.sku} ×${line.qty} failed: ${result.message}. Earlier lines already sold.`,
        );
        setCart((current) => current.filter((c) => c.productId !== line.productId));
        setBusy(false);
        void loadStock();
        return;
      }
      sold += 1;
    }
    setBusy(false);
    setLastSale(
      `Sold ${sold} line${sold === 1 ? "" : "s"} — ${money(grand)} posted to the ledger.`,
    );
    setCart([]);
    void loadStock();
  };

  return (
    <AppShell>
      <PageTitle title="New Sale | Auto Parts" />
      <div className="dashboard-container wide">
        <PageHeader
          title="New Sale"
          subtitle="Counter sale — every charged line posts a signed SALE row to the ledger."
        />

        {lastSale && (
          <div
            className="reorder-note"
            style={{ margin: "0 0 16px", background: "var(--ok-bg)", borderColor: "var(--ok-bg)", color: "var(--ok-color)" }}
          >
            <span>{lastSale}</span>
            <span
              className="cta"
              role="button"
              tabIndex={0}
              onClick={() => setLastSale(null)}
              onKeyDown={(e) => e.key === "Enter" && setLastSale(null)}
            >
              Dismiss
            </span>
          </div>
        )}

        {!isStaff && (
          <div className="charge-error" style={{ margin: "0 0 16px" }}>
            Charging a sale needs a staff account — you can browse, but the
            ledger will reject the write.
          </div>
        )}

        <div className="sale-grid">
          <section className="panel">
            <div className="lookup-bar">
              <div className="lookup-input">
                <svg viewBox="0 0 24 24" strokeWidth="1.8" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  placeholder="Search SKU / MPN / name…"
                  value={qInput}
                  onChange={(event) => setQInput(event.target.value)}
                  aria-label="Search products"
                />
              </div>
            </div>

            <div className="chip-row">
              <button
                type="button"
                className={`chip ${categoryFilter === "" ? "active" : ""}`}
                onClick={() => setCategoryFilter("")}
              >
                All parts
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`chip ${categoryFilter === c.name ? "active" : ""}`}
                  onClick={() => setCategoryFilter(c.name)}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {failed ? (
              <div className="result-row">
                <span>Failed to load products. Is the backend running?</span>
              </div>
            ) : products === null ? (
              <div className="result-row">
                <span>Loading…</span>
              </div>
            ) : visible.length === 0 ? (
              <div className="result-row">
                <span>No parts match. Try another search or category.</span>
              </div>
            ) : (
              visible.map((product) => {
                const bin = bestBin.get(product.id);
                const price = product.retailPrice === null ? null : Number(product.retailPrice);
                const sellable =
                  bin !== undefined && price !== null && !Number.isNaN(price) && bin.onHand > 0;
                const low = bin !== undefined && bin.onHand > 0 && bin.onHand <= 15;
                const inCart = cart.find((line) => line.productId === product.id);
                return (
                  <div key={product.id} className="result-row">
                    <div>
                      <div className="p-name">{product.name}</div>
                      <div className="p-sub">
                        {product.sku}
                        {product.partNumber ? ` · MPN ${product.partNumber}` : ""}
                      </div>
                    </div>
                    {bin ? (
                      <span
                        className={`bin-tag ${bin.onHand <= 6 ? "crit" : bin.onHand <= 15 ? "low" : ""}`}
                      >
                        <i />
                        {bin.binCode}
                      </span>
                    ) : (
                      <span className="stock-line">no stock</span>
                    )}
                    <div style={{ textAlign: "right" }}>
                      <div className="price">{price === null ? "Set price" : money(price)}</div>
                      <div className={`stock-line ${low ? "low" : ""}`}>
                        {bin ? (
                          <>
                            <b>{bin.onHand} in stock</b>
                            {bin.damaged > 0 ? ` · ${bin.damaged} damaged` : ""}
                          </>
                        ) : (
                          "—"
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-outline"
                      disabled={!sellable}
                      onClick={() => addToCart(product)}
                    >
                      {inCart ? `In cart ×${inCart.qty}` : "Add"}
                    </button>
                  </div>
                );
              })
            )}
          </section>

          <section className="panel cart-panel">
            <div className="cart-head">
              <h2>Cart</h2>
              <span className="cart-count">{itemCount}</span>
              {cart.length > 0 && (
                <button type="button" className="cart-clear" onClick={() => setCart([])}>
                  Clear
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="cart-line">
                <span className="stock-line">
                  Cart is empty — add parts from the lookup, then charge.
                </span>
              </div>
            ) : (
              cart.map((line) => (
                <div key={line.productId} className="cart-line">
                  <div>
                    <div className="l-name">{line.name}</div>
                    <span className="cart-pick">
                      <i />
                      Pick at {line.binCode}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="line-total">{money(line.price * line.qty)}</div>
                    <div className="stepper">
                      <button
                        type="button"
                        aria-label={`Remove one ${line.name}`}
                        onClick={() => changeQty(line.productId, -1)}
                      >
                        −
                      </button>
                      <span className="q">{line.qty}</span>
                      <button
                        type="button"
                        aria-label={`Add one ${line.name}`}
                        onClick={() => changeQty(line.productId, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

            <div className="cart-totals">
              <div className="t-row">
                <span>Subtotal</span>
                <b>{money(subtotal)}</b>
              </div>
              <div className="t-row">
                <span>Sales tax ({(TAX_RATE * 100).toFixed(2)}%)</span>
                <b>{money(tax)}</b>
              </div>
              <div className="t-row grand">
                <span>Total due</span>
                <b>{money(grand)}</b>
              </div>
            </div>

            {chargeError && <div className="charge-error">{chargeError}</div>}

            <div className="cart-pay">
              <button
                type="button"
                className="login-button"
                style={{ width: "100%", padding: "13px", fontSize: "0.9375rem", borderRadius: "8px" }}
                disabled={!isStaff || busy || cart.length === 0}
                onClick={() => void charge()}
              >
                {busy ? "Charging…" : `Charge ${money(grand)}`}
              </button>
              <div className="pay-note">
                Charging posts one signed SALE row per line — the ledger and
                stock update together.
              </div>
            </div>
          </section>
        </div>

        <PageFooter meta={<span>Register · prices come from each product's retail price</span>} />
      </div>
    </AppShell>
  );
}

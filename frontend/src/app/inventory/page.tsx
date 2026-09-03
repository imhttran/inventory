"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactEventHandler,
} from "react";
import { API_BASE, callApi, renewSessionFrom } from "@/lib/api";
import { hasRole } from "@/lib/roles";
import { PageTitle } from "@/components/PageTitle";
import { PageHeader } from "@/components/PageHeader";
import { PageFooter } from "@/components/PageFooter";
import { AppShell } from "@/components/AppShell";
import { Sparkline } from "@/components/Sparkline";

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

type ProductLite = {
  id: string;
  sku: string;
  name: string;
  retailPrice: string | null;
};

type Warehouse = { id: string; code: string; name: string };

type WarehouseLocation = { id: string; warehouseId: string; code: string };

type WarehouseGroup = { warehouse: Warehouse; locations: WarehouseLocation[] };

type LedgerRow = {
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
  productSku: string;
  productName: string;
};

type HistoryDay = {
  date: string;
  netOnHandDelta: number;
  damageUnits: number;
  movementCount: number;
};

type MutationResult = { success?: boolean; message?: string };

// Stock health thresholds (client-side until a real per-SKU reorder point
// lands in the schema): at or below CRIT shows "Reorder", LOW shows "Low".
const CRIT_AT = 6;
const LOW_AT = 15;
const STOCK_PAGE = 100;
const RECENT_LIMIT = 8;
const ADJUST_TYPES = [
  ["SALE", "Sale"],
  ["RETURN", "Return"],
  ["ADJUSTMENT", "Adjustment (signed)"],
  ["DAMAGE", "Damage"],
  ["LOST", "Lost"],
] as const;

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

function statusOf(onHand: number): "ok" | "low" | "crit" {
  if (onHand <= CRIT_AT) return "crit";
  if (onHand <= LOW_AT) return "low";
  return "ok";
}

function priceOf(products: ProductLite[], productId: string): string | null {
  return products.find((p) => p.id === productId)?.retailPrice ?? null;
}

function money(value: string | null): string {
  if (value === null) return "—";
  const n = Number(value);
  return Number.isNaN(n) ? value : `$${n.toFixed(2)}`;
}

// Per-row stock actions via the native Popover API: the menu offers Receive /
// Adjust / Transfer / Ledger, and picking one swaps the popover body to that
// mini-form (prefilled with the row's product and bin).
function StockActionsCell({
  row,
  groups,
  isStaff,
  onDone,
}: {
  row: InventoryRow;
  groups: WarehouseGroup[];
  isStaff: boolean;
  onDone: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [view, setView] = useState<
    "menu" | "receive" | "adjust" | "transfer" | "ledger"
  >("menu");
  const [qty, setQty] = useState("1");
  const [adjustType, setAdjustType] = useState<string>("SALE");
  const [targetBin, setTargetBin] = useState("");
  const [ledger, setLedger] = useState<LedgerRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    menuRef.current?.hidePopover();
  };

  const toggleMenu: ReactEventHandler<HTMLDivElement> = (event) => {
    const isOpen =
      event.nativeEvent instanceof window.ToggleEvent &&
      event.nativeEvent.newState === "open";
    if (isOpen) {
      setView("menu");
      setError(null);
      setQty("1");
      setTargetBin("");
      setLedger(null);
      const menu = menuRef.current;
      const trigger = triggerRef.current;
      if (menu && trigger) {
        const rect = trigger.getBoundingClientRect();
        menu.style.top = `${rect.bottom + 4}px`;
        menu.style.left = `${Math.max(8, rect.right - 250)}px`;
      }
      window.addEventListener("scroll", () => menuRef.current?.hidePopover(), {
        once: true,
        capture: true,
      });
    }
  };

  const run = async (path: string, body: unknown, label: string) => {
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) return;
    const result = await sendJson(authToken, path, "POST", body);
    if (result.ok) {
      close();
      onDone();
    } else {
      setError(`${label}: ${result.message}`);
    }
  };

  const submit = (kind: "receive" | "adjust" | "transfer") => {
    const quantity = Number.parseInt(qty, 10);
    if (!Number.isFinite(quantity) || quantity === 0) {
      setError("Quantity must be a non-zero whole number");
      return;
    }
    if (kind === "receive") {
      void run(
        "/api/v1/inventory/receive",
        {
          productId: row.productId,
          warehouseLocationId: row.warehouseLocationId,
          quantity,
          notes: "Received into bin",
        },
        "Receive",
      );
    } else if (kind === "adjust") {
      void run(
        "/api/v1/inventory/adjust",
        {
          productId: row.productId,
          warehouseLocationId: row.warehouseLocationId,
          transactionType: adjustType,
          quantity,
          notes: `Bin ${row.locationCode} adjustment`,
        },
        "Adjust",
      );
    } else {
      if (!targetBin) {
        setError("Transfer: pick a destination bin");
        return;
      }
      void run(
        "/api/v1/inventory/transfer",
        {
          productId: row.productId,
          fromWarehouseLocationId: row.warehouseLocationId,
          toWarehouseLocationId: targetBin,
          quantity,
          notes: "Rebalance between bins",
        },
        "Transfer",
      );
    }
  };

  const loadLedger = async () => {
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) return;
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/inventory/${row.productId}/transactions`,
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      renewSessionFrom(response);
      const data = await response.json();
      setLedger(response.ok ? (data.transactions ?? []) : []);
    } catch {
      setLedger([]);
    }
  };

  const signed = (t: LedgerRow) =>
    t.transactionType === "RECEIPT" ||
    t.transactionType === "RETURN" ||
    t.transactionType === "TRANSFER_IN";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="actions-trigger"
        onClick={() => menuRef.current?.togglePopover()}
      >
        Actions ▾
      </button>
      <div
        ref={menuRef}
        popover="auto"
        className="actions-menu-list stock-menu"
        onToggle={toggleMenu}
      >
        {view === "menu" && (
          <>
            {isStaff ? (
              <>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setView("receive")}
                >
                  Receive into {row.locationCode}…
                </button>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setView("adjust")}
                >
                  Adjust stock…
                </button>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setView("transfer")}
                >
                  Transfer to another bin…
                </button>
              </>
            ) : (
              <span className="stock-menu-note">
                Staff actions need a staff account
              </span>
            )}
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setView("ledger");
                void loadLedger();
              }}
            >
              Movement ledger…
            </button>
          </>
        )}

        {view === "receive" && (
          <div className="stock-form">
            <div className="stock-form-title">
              Receive into {row.locationCode}
            </div>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              aria-label="Quantity to receive"
            />
            <button
              type="button"
              className="login-button"
              onClick={() => submit("receive")}
            >
              Receive
            </button>
          </div>
        )}

        {view === "adjust" && (
          <div className="stock-form">
            <div className="stock-form-title">Adjust {row.productSku}</div>
            <select
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value)}
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
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              aria-label="Adjustment quantity"
            />
            <button
              type="button"
              className="login-button"
              onClick={() => submit("adjust")}
            >
              Record
            </button>
          </div>
        )}

        {view === "transfer" && (
          <div className="stock-form">
            <div className="stock-form-title">
              Transfer from {row.locationCode}
            </div>
            <select
              value={targetBin}
              onChange={(e) => setTargetBin(e.target.value)}
              aria-label="Destination bin"
            >
              <option value="">— Destination bin —</option>
              {groups.map(({ warehouse, locations }) => (
                <optgroup
                  key={warehouse.id}
                  label={`${warehouse.code} · ${warehouse.name}`}
                >
                  {locations
                    .filter((l) => l.id !== row.warehouseLocationId)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.code}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              aria-label="Quantity to transfer"
            />
            <button
              type="button"
              className="login-button"
              onClick={() => submit("transfer")}
            >
              Transfer
            </button>
          </div>
        )}

        {view === "ledger" && (
          <div className="stock-ledger">
            <div className="stock-form-title">{row.productSku} ledger</div>
            {ledger === null ? (
              <span className="stock-menu-note">Loading…</span>
            ) : ledger.length === 0 ? (
              <span className="stock-menu-note">
                No movements recorded yet.
              </span>
            ) : (
              ledger.slice(0, 8).map((t) => (
                <div key={t.id} className="ledger-row">
                  <span className={`txn ${signed(t) ? "in" : "out"}`}>
                    {t.transactionType}
                  </span>
                  <span className={`txn ${signed(t) ? "in" : "out"}`}>
                    {t.transactionType}
                  </span>
                  <span className={`delta ${signed(t) ? "in" : "out"}`}>
                    {t.quantity > 0 ? "+" : ""}
                    {t.quantity}
                  </span>
                  <span className="who">
                    {new Date(t.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {error && (
          <div className="charge-error" style={{ margin: 0 }}>
            {error}
          </div>
        )}
      </div>
    </>
  );
}

export default function InventoryPage() {
  const [me, setMe] = useState<MeUser | null>(null);
  const [stock, setStock] = useState<InventoryRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [page, setPage] = useState(1);
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [textFilter, setTextFilter] = useState("");

  const [products, setProducts] = useState<ProductLite[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [groups, setGroups] = useState<WarehouseGroup[]>([]);
  const [recent, setRecent] = useState<LedgerRow[] | null>(null);
  const [history, setHistory] = useState<HistoryDay[]>([]);
  const [failed, setFailed] = useState(false);

  const isStaff = me ? hasRole(me.role, "staff") : false;

  const refresh = useCallback(async () => {
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) return;
    try {
      const [
        stockRes,
        recentRes,
        productsRes,
        warehousesRes,
        locationsRes,
        historyRes,
      ] = await Promise.all([
        fetch(
          `${API_BASE}/api/v1/inventory?page=1&perPage=${STOCK_PAGE}` +
            (warehouseFilter ? `&warehouseId=${warehouseFilter}` : ""),
          { headers: { Authorization: `Bearer ${authToken}` } },
        ),
        fetch(
          `${API_BASE}/api/v1/inventory/transactions/recent?limit=${RECENT_LIMIT}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          },
        ),
        fetch(`${API_BASE}/api/v1/products?perPage=${STOCK_PAGE}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch(`${API_BASE}/api/v1/warehouses`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch(`${API_BASE}/api/v1/warehouses/locations`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch(`${API_BASE}/api/v1/inventory/history?days=14`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);
      [
        stockRes,
        recentRes,
        productsRes,
        warehousesRes,
        locationsRes,
        historyRes,
      ].forEach(renewSessionFrom);
      if (!stockRes.ok) throw new Error("stock");
      const stockData = await stockRes.json();
      setStock(stockData.inventory ?? []);
      setTotal(stockData.total ?? 0);
      setPage(stockData.page ?? 1);
      setPageCount(Math.max(1, stockData.pageCount ?? 1));

      const recentData = await recentRes.json().catch(() => ({}));
      setRecent(recentData.transactions ?? []);

      const productsData = await productsRes.json().catch(() => ({}));
      setProducts(productsData.products ?? []);

      const warehousesData = await warehousesRes.json().catch(() => ({}));
      setWarehouses(warehousesData.warehouses ?? []);

      const locationsData = await locationsRes.json().catch(() => ({}));
      const locations: WarehouseLocation[] = locationsData.locations ?? [];
      const nextGroups: WarehouseGroup[] = [];
      for (const warehouse of warehousesData.warehouses ?? []) {
        nextGroups.push({
          warehouse,
          locations: locations.filter((l) => l.warehouseId === warehouse.id),
        });
      }
      setGroups(nextGroups);

      const historyData = await historyRes.json().catch(() => ({}));
      setHistory(historyData.days ?? []);

      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [warehouseFilter]);

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
    if (me) void refresh();
  }, [me, refresh]);

  const rows = (stock ?? []).filter((r) => {
    if (!textFilter.trim()) return true;
    const needle = textFilter.trim().toLowerCase();
    return (
      r.productSku.toLowerCase().includes(needle) ||
      r.productName.toLowerCase().includes(needle) ||
      r.locationCode.toLowerCase().includes(needle)
    );
  });

  const onHandTotal = rows.reduce((sum, r) => sum + r.quantityOnHand, 0);
  const damagedTotal = rows.reduce((sum, r) => sum + r.quantityDamaged, 0);
  const lowRows = rows.filter((r) => statusOf(r.quantityOnHand) !== "ok");
  const critRows = rows.filter((r) => statusOf(r.quantityOnHand) === "crit");
  const today = new Date().toDateString();
  const movementsToday = (recent ?? []).filter(
    (t) => new Date(t.createdAt).toDateString() === today,
  ).length;
  const maxOnHand = Math.max(1, ...rows.map((r) => r.quantityOnHand));

  // Walk the daily net deltas backward from today's totals to get the
  // historical on-hand/damaged curve — the ledger is the source of truth for
  // both current totals, so this reconstructs exactly, no drift.
  const onHandSeries: number[] = [];
  const damagedSeries: number[] = [];
  const movementSeries: number[] = [];
  let onHandRunning = onHandTotal;
  let damagedRunning = damagedTotal;
  for (let i = history.length - 1; i >= 0; i--) {
    onHandSeries[i] = onHandRunning;
    damagedSeries[i] = damagedRunning;
    movementSeries[i] = history[i].movementCount;
    onHandRunning -= history[i].netOnHandDelta;
    damagedRunning -= history[i].damageUnits;
  }

  return (
    <AppShell>
      <PageTitle title="Inventory | Auto Parts" />
      <div className="dashboard-container wide">
        <PageHeader
          title="Inventory"
          subtitle="Stock on hand by bin, live from the movement ledger."
        />

        {failed && (
          <div className="charge-error" style={{ margin: "0 0 16px" }}>
            Failed to load stock. Is the backend running?
          </div>
        )}

        <div className="stat-grid">
          <div className="stat-card">
            <div className="k">On hand</div>
            <div className="v">
              {onHandTotal}
              <small>units</small>
            </div>
            <div className="d">across {rows.length} bin rows</div>
            <Sparkline data={onHandSeries} />
          </div>
          <div className={`stat-card ${lowRows.length ? "warn" : ""}`}>
            <div className="k">Low stock</div>
            <div className="v">
              {lowRows.length}
              <small>SKUs</small>
            </div>
            <div className="d">at or below {LOW_AT} units</div>
          </div>
          <div className={`stat-card ${damagedTotal ? "crit" : ""}`}>
            <div className="k">Damaged</div>
            <div className="v">
              {damagedTotal}
              <small>units</small>
            </div>
            <div className="d">awaiting write-off</div>
            <Sparkline data={damagedSeries} />
          </div>
          <div className="stat-card">
            <div className="k">Movements today</div>
            <div className="v">{movementsToday}</div>
            <div className="d">ledger rows</div>
            <Sparkline data={movementSeries} />
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Bin stock</h2>
            <span className="hint">
              {warehouses.length} warehouse{warehouses.length === 1 ? "" : "s"}
            </span>
            <select
              value={warehouseFilter}
              onChange={(event) => setWarehouseFilter(event.target.value)}
              aria-label="Warehouse"
              style={{ marginLeft: "auto", maxWidth: 220 }}
            >
              <option value="">All warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.code} · {w.name}
                </option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Filter by SKU, name, bin…"
              value={textFilter}
              onChange={(event) => setTextFilter(event.target.value)}
              aria-label="Filter stock"
              className="stock-filter-input"
            />
          </div>

          <div className="table-scroll">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Bin</th>
                  <th>Part</th>
                  <th style={{ textAlign: "right" }}>On hand</th>
                  <th style={{ textAlign: "right" }}>Level</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Unit price</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {stock === null && !failed ? (
                  <tr>
                    <td colSpan={7}>Loading…</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No stock rows match.</td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const status = statusOf(r.quantityOnHand);
                    const pct = Math.min(
                      100,
                      Math.round((r.quantityOnHand / maxOnHand) * 100),
                    );
                    return (
                      <tr key={r.id}>
                        <td>
                          <span
                            className={`bin-tag ${status === "ok" ? "" : status}`}
                          >
                            <i />
                            {r.locationCode}
                          </span>
                        </td>
                        <td>
                          <div className="part-name">{r.productName}</div>
                          <div className="part-sub">{r.productSku}</div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <b>{r.quantityOnHand}</b>
                          {r.quantityDamaged > 0 && (
                            <span className="qty-dmg">
                              {" "}
                              {r.quantityDamaged} dmg
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <span
                            className={`level-bar ${status === "ok" ? "" : status}`}
                          >
                            <i style={{ width: `${pct}%` }} />
                          </span>
                        </td>
                        <td>
                          <span className={`pill ${status}`}>
                            {status === "crit"
                              ? "Reorder"
                              : status === "low"
                                ? "Low"
                                : "Healthy"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }} className="mono">
                          {money(priceOf(products, r.productId))}
                        </td>
                        <td>
                          <StockActionsCell
                            row={r}
                            groups={groups}
                            isStaff={isStaff}
                            onDone={() => void refresh()}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="user-pager">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setPage(page - 1);
                }}
              >
                Prev
              </button>
              <span>
                Page {page} of {pageCount}
              </span>
              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() => {
                  setPage(page + 1);
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="ops-lower">
          <div className="panel">
            <div className="panel-head">
              <h2>Recent movements</h2>
              <span className="hint">newest first</span>
            </div>
            <div className="ledger-list">
              {recent === null ? (
                <div className="ledger-row">Loading…</div>
              ) : recent.length === 0 ? (
                <div className="ledger-row">
                  No movements recorded yet — receive or adjust stock to fill
                  the ledger.
                </div>
              ) : (
                recent.map((t) => {
                  const isIn =
                    t.transactionType === "RECEIPT" ||
                    t.transactionType === "RETURN" ||
                    t.transactionType === "TRANSFER_IN";
                  const isMove = t.transactionType.startsWith("TRANSFER");
                  return (
                    <div key={t.id} className="ledger-row">
                      <span className={`txn ${isIn ? "in" : "out"}`}>
                        {t.transactionType}
                      </span>
                      <span>{t.productName}</span>
                      {t.locationCode && (
                        <span className="mono">→ {t.locationCode}</span>
                      )}
                      <span className={`delta ${isIn ? "in" : "out"}`}>
                        {t.quantity > 0 ? "+" : ""}
                        {t.quantity}
                      </span>
                      <span className="who">
                        {new Date(t.createdAt).toLocaleString()}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h2>Reorder now</h2>
            </div>
            {critRows.length === 0 && lowRows.length === 0 ? (
              <div className="note-foot">
                Nothing below the {LOW_AT}-unit reorder line. Thresholds are
                workspace-wide for now; per-SKU reorder points are next.
              </div>
            ) : (
              <>
                {critRows.map((r) => (
                  <div key={r.id} className="reorder-note">
                    <span>
                      <b>{r.productSku}</b> down to {r.quantityOnHand} in{" "}
                      {r.locationCode} — reorder now.
                    </span>
                  </div>
                ))}
                {lowRows
                  .filter((r) => statusOf(r.quantityOnHand) === "low")
                  .map((r) => (
                    <div key={r.id} className="reorder-note">
                      <span>
                        <b>{r.productSku}</b> at {r.quantityOnHand} in{" "}
                        {r.locationCode}.
                      </span>
                    </div>
                  ))}
                <div className="note-foot">
                  Thresholds: ≤{CRIT_AT} reorder · ≤{LOW_AT} low. Per-SKU
                  reorder points are next.
                </div>
              </>
            )}
          </div>
        </div>

        <PageFooter
          meta={
            <span>
              {isStaff ? "Staff view" : "Read-only (client role)"} · mutations
              write signed ledger rows
            </span>
          }
        />
      </div>
    </AppShell>
  );
}

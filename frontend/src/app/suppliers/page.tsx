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
import { AppShell } from "@/components/AppShell";

type MeUser = {
  id: number;
  email: string;
  role: string;
  mustChangePassword?: boolean;
  hasProfile?: boolean;
};

type Supplier = {
  id: string;
  name: string;
  supplierCode: string | null;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type MutationResult = { success?: boolean; message?: string };

// Shared by create/update/delete: posts JSON with the session token and
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

const FORM_FIELDS = [
  "name",
  "supplierCode",
  "phone",
  "email",
  "addressLine1",
  "addressLine2",
  "city",
  "state",
  "postalCode",
  "country",
] as const;

export default function SuppliersPage() {
  const [me, setMe] = useState<MeUser | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [failed, setFailed] = useState(false);
  // Null = create mode; a supplier id = edit that supplier in the same form.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const addFormRef = useRef<HTMLDetailsElement>(null);

  const isStaff = me ? hasRole(me.role, "staff") : false;
  const isAdmin = me ? hasRole(me.role, "admin") : false;

  const loadSuppliers = useCallback(async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/suppliers`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      renewSessionFrom(response);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setSuppliers(data.suppliers ?? []);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

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
      await loadSuppliers(stored);
    })();
  }, [loadSuppliers]);

  const withToken = useCallback((run: (authToken: string) => Promise<void>) => {
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) return;
    void run(authToken);
  }, []);

  const startEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setEditingSupplier(supplier);
    if (addFormRef.current) addFormRef.current.open = true;
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingSupplier(null);
    if (addFormRef.current) addFormRef.current.open = false;
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body: Record<string, string> = {};
    for (const field of FORM_FIELDS) {
      body[field] = String(data.get(field) ?? "").trim();
    }
    withToken(async (authToken) => {
      const result = editingId
        ? await sendJson(
            authToken,
            `/api/v1/suppliers/${editingId}`,
            "PUT",
            body,
          )
        : await sendJson(authToken, "/api/v1/suppliers", "POST", body);
      if (result.ok) {
        alert(result.message);
        setEditingId(null);
        setEditingSupplier(null);
        if (addFormRef.current) addFormRef.current.open = false;
        await loadSuppliers(authToken);
      } else {
        alert(`Error: ${result.message}`);
      }
    });
  };

  // Supplier rows for the table: null while loading; the failed banner takes
  // over on failure.
  const rows = suppliers ?? [];

  const handleDelete = (supplier: Supplier) => {
    if (!window.confirm(`Delete supplier "${supplier.name}"?`)) return;
    withToken(async (authToken) => {
      const result = await sendJson(
        authToken,
        `/api/v1/suppliers/${supplier.id}`,
        "DELETE",
        undefined,
      );
      if (result.ok) {
        if (editingId === supplier.id) {
          setEditingId(null);
          setEditingSupplier(null);
        }
        await loadSuppliers(authToken);
      } else {
        alert(`Error: ${result.message}`);
      }
    });
  };

  return (
    <AppShell>
      <div className="dashboard-container wide">
        <PageTitle title="Suppliers | Auto Parts" />
        <PageHeader
          title="Suppliers"
          subtitle="Vendors and purchase sources."
        />

        {isStaff && (
          <div className="dashboard-card">
            <details ref={addFormRef}>
              <summary className="add-user-toggle">
                {editingId ? "Edit Supplier" : "Add Supplier"}
              </summary>
              {/* key: defaults must re-seed whenever the edited row changes. */}
              <form
                key={editingId ?? "new"}
                className="add-user-form"
                onSubmit={handleSave}
              >
                <input
                  type="text"
                  name="name"
                  placeholder="Supplier name"
                  defaultValue={editingSupplier?.name ?? ""}
                  required
                />
                <input
                  type="text"
                  name="supplierCode"
                  placeholder="Supplier code"
                  defaultValue={editingSupplier?.supplierCode ?? ""}
                />
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone"
                  defaultValue={editingSupplier?.phone ?? ""}
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  defaultValue={editingSupplier?.email ?? ""}
                />
                <input
                  type="text"
                  name="addressLine1"
                  placeholder="Address line 1"
                  defaultValue={editingSupplier?.addressLine1 ?? ""}
                />
                <input
                  type="text"
                  name="addressLine2"
                  placeholder="Address line 2"
                  defaultValue={editingSupplier?.addressLine2 ?? ""}
                />
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  defaultValue={editingSupplier?.city ?? ""}
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  defaultValue={editingSupplier?.state ?? ""}
                />
                <input
                  type="text"
                  name="postalCode"
                  placeholder="Postal code"
                  defaultValue={editingSupplier?.postalCode ?? ""}
                />
                <input
                  type="text"
                  name="country"
                  placeholder="Country (USA)"
                  defaultValue={editingSupplier?.country ?? ""}
                />
                <button type="submit" className="login-button">
                  {editingId ? "Save Changes" : "Add Supplier"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="login-button"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                )}
              </form>
            </details>
          </div>
        )}

        <div className="dashboard-card">
          <div className="table-scroll">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>City</th>
                  <th>Country</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers === null && !failed ? (
                  <tr>
                    <td colSpan={7}>Loading…</td>
                  </tr>
                ) : failed ? (
                  <tr>
                    <td colSpan={7}>
                      Failed to load suppliers. Is the backend running?
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No suppliers yet.</td>
                  </tr>
                ) : (
                  rows.map((supplier) => (
                    <tr key={supplier.id}>
                      <td>{supplier.name}</td>
                      <td>{supplier.supplierCode || "—"}</td>
                      <td>{supplier.phone || "—"}</td>
                      <td>{supplier.email || "—"}</td>
                      <td>{supplier.city || "—"}</td>
                      <td>{supplier.country}</td>
                      <td>
                        {isStaff && (
                          <>
                            <button
                              type="button"
                              className="link-button"
                              onClick={() => startEdit(supplier)}
                            >
                              Edit
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                className="logout-link"
                                onClick={() => {
                                  withToken(async (authToken) => {
                                    const result = await sendJson(
                                      authToken,
                                      `/api/v1/suppliers/${supplier.id}`,
                                      "DELETE",
                                      undefined,
                                    );
                                    if (result.ok) {
                                      if (editingId === supplier.id)
                                        cancelEdit();
                                      await loadSuppliers(authToken);
                                    } else {
                                      alert(`Error: ${result.message}`);
                                    }
                                  });
                                }}
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
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

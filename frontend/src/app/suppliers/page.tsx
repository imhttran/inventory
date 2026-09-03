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
  // Inline save result (success/error) shown under the form card.
  const [status, setStatus] = useState<FormStatusState>(null);
  // Bumped after each successful add to remount a blank form for the next entry.
  const [formNonce, setFormNonce] = useState(0);
  const addFormRef = useRef<HTMLDetailsElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

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

  // After the form mounts open or remounts (edit seed / post-add reset), put
  // the cursor in the name field — entry continues without a mouse. Skipped
  // when the form is closed so focus is never stolen from the page.
  useEffect(() => {
    if (addFormRef.current?.open) nameInputRef.current?.focus();
  }, [formNonce, editingId]);

  const focusToggle = () => {
    addFormRef.current?.querySelector("summary")?.focus();
  };

  const closeForm = () => {
    if (addFormRef.current) addFormRef.current.open = false;
    focusToggle();
  };

  const startEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setEditingSupplier(supplier);
    setStatus(null);
    if (addFormRef.current && !addFormRef.current.open) {
      addFormRef.current.open = true;
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingSupplier(null);
    setStatus(null);
    closeForm();
  };

  // Add mode always opens blank; focus follows via the remount effect above.
  const handleToggle = () => {
    if (!addFormRef.current?.open) return;
    if (!editingId) setFormNonce((n) => n + 1);
    setStatus(null);
  };

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const wasEditing = editingId;
    const data = new FormData(event.currentTarget);
    const body: Record<string, string> = {};
    for (const field of FORM_FIELDS) {
      body[field] = String(data.get(field) ?? "").trim();
    }
    withToken(async (authToken) => {
      const result = wasEditing
        ? await sendJson(
            authToken,
            `/api/v1/suppliers/${wasEditing}`,
            "PUT",
            body,
          )
        : await sendJson(authToken, "/api/v1/suppliers", "POST", body);
      if (result.ok) {
        setStatus({ kind: "ok", text: result.message });
        if (wasEditing) {
          setEditingId(null);
          setEditingSupplier(null);
          if (addFormRef.current) addFormRef.current.open = false;
          focusToggle();
        } else {
          // Batch entry: stay open, blank the form, and put the cursor back
          // on the name field for the next supplier (remount effect).
          setFormNonce((n) => n + 1);
        }
        await loadSuppliers(authToken);
      } else {
        setStatus({ kind: "error", text: `Error: ${result.message}` });
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
            <details ref={addFormRef} onToggle={handleToggle}>
              <summary className="add-user-toggle">
                {editingId ? "Edit Supplier" : "Add Supplier"}
              </summary>
              {/* key: defaults must re-seed whenever the edited row changes,
                and after each successful add so the next entry starts blank. */}
              <form
                key={editingId ?? `new-${formNonce}`}
                className="add-user-form entry-form"
                onSubmit={handleSave}
                onKeyDown={formKeys(() =>
                  editingId ? cancelEdit() : closeForm(),
                )}
              >
                <p className="form-hint">
                  Enter moves to the next field; Enter on the last field saves.
                  Esc closes.
                </p>
                <div className="field-grid">
                  <Field label="Name" span={2}>
                    <input
                      ref={nameInputRef}
                      type="text"
                      name="name"
                      placeholder="Acme Auto Parts"
                      autoComplete="organization"
                      defaultValue={editingSupplier?.name ?? ""}
                      required
                    />
                  </Field>
                  <Field label="Supplier code" span={2}>
                    <input
                      type="text"
                      name="supplierCode"
                      placeholder="SUP-001"
                      autoComplete="off"
                      defaultValue={editingSupplier?.supplierCode ?? ""}
                    />
                  </Field>
                  <Field label="Phone" span={2}>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone"
                      autoComplete="tel"
                      defaultValue={editingSupplier?.phone ?? ""}
                    />
                  </Field>
                  <Field label="Email" span={2}>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      autoComplete="email"
                      defaultValue={editingSupplier?.email ?? ""}
                    />
                  </Field>
                  <Field label="Address line 1" span={4}>
                    <input
                      type="text"
                      name="addressLine1"
                      placeholder="Street address"
                      autoComplete="address-line1"
                      defaultValue={editingSupplier?.addressLine1 ?? ""}
                    />
                  </Field>
                  <Field label="Address line 2" span={4}>
                    <input
                      type="text"
                      name="addressLine2"
                      placeholder="Apt, suite, unit"
                      autoComplete="address-line2"
                      defaultValue={editingSupplier?.addressLine2 ?? ""}
                    />
                  </Field>
                  <Field label="City">
                    <input
                      type="text"
                      name="city"
                      placeholder="City"
                      autoComplete="address-level2"
                      defaultValue={editingSupplier?.city ?? ""}
                    />
                  </Field>
                  <Field label="State">
                    <input
                      type="text"
                      name="state"
                      placeholder="State"
                      autoComplete="address-level1"
                      defaultValue={editingSupplier?.state ?? ""}
                    />
                  </Field>
                  <Field label="Postal code">
                    <input
                      type="text"
                      name="postalCode"
                      placeholder="Postal code"
                      autoComplete="postal-code"
                      defaultValue={editingSupplier?.postalCode ?? ""}
                    />
                  </Field>
                  <Field label="Country">
                    <input
                      type="text"
                      name="country"
                      placeholder="Country"
                      autoComplete="country-name"
                      defaultValue={editingSupplier?.country ?? "USA"}
                    />
                  </Field>
                </div>
                <div className="form-actions">
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
                </div>
              </form>
            </details>
            {/* Outside the details so it stays visible after the form closes. */}
            <FormStatus status={status} />
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

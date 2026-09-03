# Demo Video Script — Auto Parts Inventory

Reference stills from the verified rehearsal takes live in
[`demo-stills/`](../demo-stills/) — 11 shots from the scene-by-scene rehearsal
(`demo-01` … `demo-11`) and 7 from the full continuous take (`demo-take2-01`
… `demo-take2-07`). Use them as framing reference for each shot below.

A raw scripted screencast of the full take also exists:
[`demo-recording/demo-take.webm`](../demo-recording/demo-take.webm)
(1280×720, ~3:15, silent — lay the narration over it). It was driven by
automation, so the cursor moves are mechanical and one cart mis-click gets
cleared mid-scene (which doubles as a Clear-button demo). Treat it as a
scratch track for pacing, not the final product.

A narrated cut exists too: [`demo-recording/demo-take-final-narrated.webm`](../demo-recording/demo-take-final-narrated.webm)
— the `say` voice "Reed (English (US))" laid over the take (2:18, the dead air
between scenes cut out). Scene 1's narration omits the login/2FA sentence —
the 2FA moment plays silently on camera. Narration offsets (seconds, for
re-mixing — see also `demo-recording/marks.json`):

| Segment           | Start  | Duration |
| ----------------- | ------ | -------- |
| Cold open         | 0.8s   | 11.8s    |
| Scene 1 (trimmed) | 5.2s   | 10.1s    |
| Scene 2           | 16.9s  | 17.1s    |
| Scene 3           | 36.5s  | 19.4s    |
| Scene 4           | 71.2s  | 33.6s    |
| Scene 5           | 121.8s | 14.6s    |

Reference for the recording session:

- The 2FA verification code is **always `1234`** in development.
- **Do not reset the data** — the seeded catalog and current stock are the demo.
- Narration: **warm, American male voice** — friendly, unhurried, short sentences.
  The paste-ready TTS track lives in [docs/DEMO_NARRATION.md](DEMO_NARRATION.md).
- Target length: **3–4 minutes**.

## Pre-flight checklist

| Check                           | Value                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------- |
| Backend                         | http://localhost:8080 (`/api/health` returns ok)                             |
| Frontend                        | http://localhost:3000                                                        |
| Admin                           | `admin@mail.com` / `Password1234!`                                           |
| Staff                           | `staff@mail.com` / `Password1234!`                                           |
| Client                          | `user@mail.com` / `Password1234!`                                            |
| Demo user                       | `demo@mail.com` / `DemoPass123!` (created in-scene with temp `TempPass123!`) |
| Mailpit inbox (optional B-roll) | http://localhost:8025                                                        |

First login from a fresh browser profile asks for a 2FA code — use `1234`.
The browser is trusted afterwards. Use a clean browser profile when recording
so the 2FA step appears on camera.

---

## Shot list — stills per scene

| Scene                        | Reference stills (`demo-stills/`)                                                                   |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| 1 — Admin creates a user     | `demo-take2-01`, `demo-01`                                                                          |
| 2 — First login & onboarding | `demo-take2-02` (2FA), `demo-02` (password change), `demo-take2-03`, `demo-03` (dashboard + search) |
| 3 — Client cart              | `demo-take2-04`, `demo-04`                                                                          |
| 4 — Staff actions            | `demo-take2-05` (charge toast), `demo-take2-06` (inventory ledger), `demo-05`, `demo-06`            |
| 5 — Admin controls           | `demo-take2-07`                                                                                     |
| Optional: suppliers          | `demo-07`                                                                                           |
| Optional: add product        | `demo-08`                                                                                           |
| Optional: search page        | `demo-09`, `demo-11` (post-fix, one row per part)                                                   |
| Optional: ledger dialog      | `demo-10`                                                                                           |

---

## Scene 1 — Admin login and creating a user (~45s)

**On screen:** login page → 2FA → dashboard → Add User form → users table.

1. Sign in as `admin@mail.com` / `Password1234!`.
2. Enter `1234` on the verification screen.
3. On the dashboard, point out the **System Status** card (Rust API ok, PostgreSQL ok).
4. Open **Add User**, type `demo@mail.com` and temporary password `TempPass123!`, submit.
5. Show `demo@mail.com` appear in the Users table as a `client`.

**Narration:**

> "Let's start as an administrator. I'll sign in with my admin account —
> and since this is a new device, the app asks for a one-time verification code.
> Now, from the dashboard, I can invite a new user in seconds.
> Just an email and a temporary password — the app takes care of the rest.
> The new account shows up right here in the users list."

## Scene 2 — The new user's first login (~45s)

**On screen:** login as the new user → forced password change → profile form → dashboard.

1. Log out. Sign in as `demo@mail.com` / `TempPass123!`, 2FA code `1234`.
2. The app **forces a password change** — set `DemoPass123!`.
3. The app routes to **Complete Your Profile** — fill first/last name, address,
   state, zip, phone, contact method (e.g. Danny Rivera, Austin TX).
4. Land on the dashboard as a `client` — note the sidebar has **no Counter**
   section and no Users card; footer reads "Role: client".
5. Use the dashboard **Search parts** box — type `brake`, results stream in.

**Narration:**

> "Danny just received his temporary password. On his very first sign-in,
> the app walks him through everything: he sets his own password,
> completes his profile — and lands on a personalized dashboard.
> Right away he can search the parts catalog — live results as he types."

## Scene 3 — What a client can do (~40s)

**On screen:** New Sale page as `user@mail.com` — browsing, cart, disabled charge.

1. Log out, sign in as `user@mail.com` / `Password1234!`, 2FA `1234`.
2. Go to **New Sale**. Point out the banner: "Charging a sale needs a staff account".
3. Browse the grid, add a **Bosch QuietCast Brake Pad set** and **NGK Iridium plugs**.
4. In the cart: bump quantities with **+ / −**, show **Clear**.
5. Show the totals: subtotal, 8.25% tax, total due — and the **Charge button
   greyed out**.

**Narration:**

> "Here's the same app through a customer's eyes. They can browse the full
> catalog, build a cart, adjust quantities — everything reads instantly.
> But the charge button stays disabled: checkout is a staff action,
> and the backend enforces it, not just the interface."

## Scene 4 — Staff in action (~60s)

**On screen:** login as `staff@mail.com` → charge a sale → inventory receive → transfer.

1. Log out, sign in as `staff@mail.com` / `Password1234!`, 2FA `1234`.
2. **New Sale**: the warning banner is gone; filter by **Brakes**, add 2 sets of
   brake pads, press **Charge $133.02**. Toast: "Sold 1 line — $133.02 posted
   to the ledger."
3. Go to **Inventory**: the KPI cards (on-hand, low stock, damaged, movements
   today) and the newest ledger row — the `SALE −2` just posted.
4. Find the **Denso Alternator** flagged **Reorder** (6 left). Actions →
   **Receive into B-02-01…** → quantity 10 → Receive. It flips to 16, Healthy.
5. On the brake pads row: Actions → **Transfer to another bin…** → destination
   `B-02-01`, quantity 5 → Transfer. Ledger shows `TRANSFER_OUT −5` and
   `TRANSFER_IN +5`.

**Narration:**

> "Now the counter. Staff signs in and the sale goes through in one click —
> every line posts a signed row to the ledger, and stock updates atomically.
> Over in inventory, everything is live: the sale we just rang up is already
> in the movement history. This alternator is below its reorder point —
> a delivery just arrived, so I'll receive ten units... and it's healthy again.
> And when parts move between bins, the transfer writes both sides of the move —
> out of one bin, into the other. Every change is accounted for."

## Scene 5 — Admin controls close it out (~30s, optional)

**On screen:** dashboard as admin — role dropdown, verify toggle, reset password.

1. Back on the dashboard as `admin@mail.com`, scroll to **Users**.
2. Change a role from the dropdown, toggle **Verify**, show **Reset Password**
   and **Delete** in the row's Actions menu.
3. Point at the footer: "Role: admin".

**Narration:**

> "And administration ties it together — roles, verification, password resets,
> all managed from one screen. One app, three levels of access,
> and a complete audit trail behind every change."

---

## Optional scenes — rehearsed and verified

All of these were driven end to end on the current build. Exact flows and
on-camera gotchas below.

### Suppliers (staff) — verified

- **Add Supplier** form fields: Name, Supplier code, Phone, Email, Address
  line 1/2, City, State, Postal code, Country (defaults USA). Row appears
  instantly in the table.
- Staff sees **Edit** per row; **Delete** is admin-only (hidden for staff).
- Rehearsed with "Brembo North America / BREM-01" — that row persists in the
  dev database and is safe to reuse on camera.

### Add Product (staff) — verified

- Form fields: SKU, Name, Part number (MPN), Retail price, Description,
  Brand, Category. The submit button stays **disabled until brand AND
  category are chosen** — pick them before narrating the click.
- **+ Brand / + Category create inline via native browser `prompt()`
  dialogs** ("New brand name:" → "Brand created" alert). Slightly clunky on
  camera — either embrace it (it's a real inline-create flow) or pre-create
  the brand and skip the dialog.
- Rehearsed with `BRK-BRM-920 / P50-920 / Brembo Sport Brake Pads / $129.99`
  plus an inline-created **Brembo** brand. The new part has **no stock yet** —
  a natural follow-up beat: receive its initial stock on the Inventory page.

### Search page — verified, after fixing a real bug

- Dedicated full-text search (name / SKU / MPN / brand / category) with a
  View link into the product page.
- **Bug found and fixed during rehearsal**: results showed every part three
  times. Elasticsearch had 31 stale documents vs 11 real products — the
  reindex routine never purged the index, so documents from wiped seed
  cycles haunted results forever. `reindex_all` in
  `backend/src/search/mod.rs` now clears the index before bulk-indexing.
  The live data was also purged and re-indexed (11 docs, one row per part).
  **The code fix needs a backend restart to load** — the running process
  still has the old binary, but the data is already clean, so search shows
  single rows today.

### Movement ledger dialog — verified

- Inventory → row Actions → **Movement ledger…** opens the per-part audit
  trail: `TRANSFER_OUT −5`, `TRANSFER_IN +5`, `SALE −2`, `RECEIPT +24`,
  `DAMAGE −2` for the brake pads. Strong visual for "every change is
  accounted for".

### Admin user controls — verified

- Actions menu on a verified user: **Unverify / Reset Password / Delete**.
- Unverify a user and the menu gains **Resend Verification** (it only
  appears for unverified users) — that's the email B-roll hook.
- Round-tripped Unverify → Verify on `demo@mail.com`; state restored.
- **Trusted browser note**: repeat logins on the same browser profile skip
  the 2FA screen entirely (the device is trusted). Scene 1's 2FA moment only
  appears with a fresh profile.

### Mailpit email B-roll — currently unavailable on native dev

- Mailpit (http://localhost:8025) has only the infra SMTP-check email. The
  backend running natively has **no root `.env`**, so `SMTP_HOST` is unset
  and every app email (2FA codes, resets) is logged to the backend console
  instead.
- To enable Mailpit B-roll: copy `.env.example` → `.env`, set
  `SMTP_HOST=localhost` and `SMTP_PORT=1025`, restart the backend, then
  trigger an email (e.g. Resend Verification on an unverified user).
- For the main script this is optional anyway: the 2FA code is always
  `1234`, so nothing on camera depends on the inbox.

## Recording notes

- Use a **clean browser profile** so every login shows the 2FA step — a
  trusted profile skips it silently.
- The demo user (`demo@mail.com`) persists between takes: if you need to
  re-record Scene 2's onboarding, delete the user from the admin dashboard
  first, then re-create it with the temp password `TempPass123!`.
- Rehearsed and verified end to end on 2026-09-03: every step above works on
  the current build. Two bugs were found and fixed along the way — the
  transfer dropdown (missing all-locations route; frontend now fans out
  per-warehouse) and duplicate search results (reindex now purges stale
  Elasticsearch documents; **restart the backend to load this fix**).

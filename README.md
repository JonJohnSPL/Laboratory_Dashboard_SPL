# Lab WIP Dashboard

This project is now structured so it can live in a GitHub repository and run as a static site while storing shared data behind authenticated cloud access.

## Recommended architecture

- GitHub repository: source control and deployment target
- GitHub Pages: static hosting for `lab-dashboard.html` and `import.html`
- Supabase: centralized storage plus password-based user authentication

GitHub alone is not enough for shared runtime data or secure login. The app was originally browser-only and saved everything into each user's `localStorage`, so a backend service is required for centralized access.

## What changed

- `cloud-auth.js` adds a sign-in gate and provides a shared `window.storage` adapter.
- `app-config.js` is the public runtime config file for browser-safe values such as the Supabase URL and anon key.
- `index.html` redirects GitHub Pages root traffic to `lab-dashboard.html`.
- `supabase/schema.sql` creates the shared storage table and access policies.

If `app-config.js` is left blank or missing from the hosted site, the app stays in local browser mode so you can still use it before cloud setup is finished.
Do not put private service-role keys or webhook URLs in `app-config.js`; GitHub Pages serves it publicly.

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor and run [`supabase/schema.sql`](./supabase/schema.sql).
3. In Authentication, create users for each staff member.
4. Edit [`app-config.js`](./app-config.js) with your project URL and anon key.
5. If you want username-style logins instead of full email entry, set `authEmailSuffix` to a suffix such as `@lab.local`.
6. Create users in Supabase with emails that match that suffix, for example `jsmith@lab.local`.

With `authEmailSuffix` set, staff can type `jsmith` plus their password, and the frontend will resolve it to `jsmith@lab.local` during sign-in.

For password recovery, add this redirect URL in Supabase Auth URL Configuration:

```text
https://jonjohnspl.github.io/Laboratory_Dashboard_SPL/password-reset.html
```

## Field Ops Teams alerts

The browser calls the `field-ops-teams` Supabase Edge Function instead of calling the Teams webhook directly.
Store the Teams/Power Automate URL as a Supabase secret:

```text
FIELD_OPS_TEAMS_WEBHOOK_URL
```

Then deploy the function:

```text
supabase functions deploy field-ops-teams
```

## Geotab fleet status

The Resources view can link trucks and trailers to Geotab devices and display the current device communication state. Geotab credentials stay in the `geotab-fleet-status` Edge Function and must not be added to `app-config.js`.

Configure a dedicated, read-only Geotab API user and store these Supabase secrets:

```text
GEOTAB_DATABASE
GEOTAB_USERNAME
GEOTAB_PASSWORD
```

`GEOTAB_SERVER` is optional and defaults to `my.geotab.com`. Deploy the function with:

```text
supabase functions deploy geotab-fleet-status
```

Run the latest `supabase/schema.sql`, open Field Ops > Resources, and select **Refresh GPS**. Unlinked trucks are matched only by an exact VIN, license plate, or unit-number/device-name match. Unlinked trailers are matched first by VIN, then by an exact trailer-number/device-name match. A Geotab device ID can also be entered directly in either asset editor.

## DoneSafe Equipment Tracker

The Field Ops Resources view can synchronize the `Equipment Tracker` module from the `splinc` HSI DoneSafe tenant. DoneSafe remains the system of record; the dashboard stores a read-only cache plus the original payload for tenant-specific fields.

Create or use a read-only DoneSafe integration account and store its credentials as Supabase Edge Function secrets:

```text
DONESAFE_TENANT=splinc
DONESAFE_USERNAME=integration-account@example.com
DONESAFE_PASSWORD=replace-with-the-account-password
```

Optional routing and module overrides:

```text
DONESAFE_API_URL=https://splinc.na.hsiplatform.com
DONESAFE_EQUIPMENT_MODULE_NAME=Equipment Tracker
DONESAFE_EQUIPMENT_MODULE_ID=30
DONESAFE_RECORD_URL_TEMPLATE=
```

`DONESAFE_API_URL` defaults to `https://splinc.na.hsiplatform.com` for this tenant. Do not set `DONESAFE_CLIENT_SUBDOMAIN` unless HSI support provides a specific value; the North America tenant accepts API requests directly at its own host.

Do not add these values to `app-config.js` or commit them to a file. Apply the latest `supabase/schema.sql`, deploy the function, then open **Field Ops > Resources > Equipment** and select **Sync DoneSafe**:

```text
supabase functions deploy donesafe-equipment-sync
```

If the DoneSafe account uses mandatory SSO or MFA, request a dedicated API/integration account from the DoneSafe administrator. For the `splinc` tenant, Equipment Tracker is module ID `30` (internal name `spl_equipment`), and the function defaults to that ID.

## GitHub repo and Pages

1. Create a new empty GitHub repository.
2. Push this folder to the `main` branch.
3. In the GitHub repo settings, enable GitHub Pages from the `main` branch root.
4. Open the Pages URL and verify login works.

## Operational notes

- Shared data is stored in the `app_state` table by key.
- The current behavior is last-write-wins. If two users edit the same data at the same time, the most recent save will replace the older one.
- Column visibility still uses local browser storage because it is a personal UI preference, not shared lab data.
- The Field Ops `field-assets` storage bucket is used for uploaded asset photos and client logos.
- Field Ops imports read-only Salesforce tickets through Supabase. Manual number/URL links remain available as a compatibility fallback.

## Test Catalog and lab-specific Test Setup

Run the latest `supabase/schema.sql` before opening `test-catalog.html` or `test-setup.html`. The forward migration keeps each Test Code in `lab_test_types`, moves aliases to `lab_test_type_aliases`, imports reusable standards into `lab_methods`, and moves lab timing, workload counting, bundles, and instrument assignments into site-scoped `lab_test_setups` and `lab_instruments`.

Existing Lab WIP definitions become Pittsburgh migration-placeholder setups so historical estimates remain available until an administrator assigns an instrument or explicitly selects **No instrument required**. New imported work-order test rows are deliberately unassigned and contribute no estimated time until a setup is selected. Existing client billing selections, rates, and notes are preserved; legacy billing items are resolved from the **Legacy Items** tab without silent rate overwrites.

Administrators manage the global Test Catalog. Employees with `lab.tests.view` can read it, while `lab.tests.manage` permits instrument and Test Setup changes only for the employee's relational Home SPL Site. The former `master-methods.html` and `test-types.html` paths remain compatibility redirects.

## Salesforce ticket import and linking

Salesforce remains authoritative for ticket fields. The dashboard caches only records selected by the shared Pittsburgh Field Ops list view and owns the one-to-one job link. The integration performs no Salesforce create, update, or delete requests.

Ask a Salesforce administrator to create an External Client App with OAuth client-credentials flow and a designated, preferably API-only integration user. Give that user read access only to Accounts, the chosen ticket object and its mapped fields, metadata, and the shared Pittsburgh Field Ops list view.

Store the credentials as Supabase Edge Function secrets; never add them to `app-config.js`:

```text
SALESFORCE_MY_DOMAIN_URL=https://spl.my.salesforce.com
SALESFORCE_CONNECTED_APP_CONSUMER_KEY=replace-with-consumer-key
SALESFORCE_CONNECTED_APP_CONSUMER_SECRET=replace-with-consumer-secret
```

`SALESFORCE_API_VERSION` is optional and defaults to `v68.0`. The Edge Function accepts a current `SUPABASE_SECRET_KEY`/`SUPABASE_SECRET_KEYS` value and temporarily falls back to the legacy `SUPABASE_SERVICE_ROLE_KEY` during migration.

Apply the latest schema and deploy both functions:

```text
supabase functions deploy salesforce-ticket-sync
supabase functions deploy salesforce-case
```

The second deployment replaces the former write-capable endpoint with a non-writing HTTP 410 retirement response. Then open **Field Ops > Resources > Salesforce Tickets** and run **Configure**, **Test Connection**, select the ticket object and Pittsburgh Field Ops list view, validate the field mappings, **Preview**, and **Sync Tickets**.

In the client editor, search Salesforce Accounts and save an explicit Account mapping. Job ticket choices then default to active, unlinked tickets with that exact Account ID; administrators can explicitly show all Pittsburgh tickets. Link and unlink operations run through database RPCs so concurrent users cannot assign the same imported ticket to two jobs. Existing manual ticket links continue to work as compatibility exceptions.

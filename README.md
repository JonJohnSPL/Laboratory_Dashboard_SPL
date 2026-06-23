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
- Field Ops Salesforce ticket linking is currently manual. Paste the Salesforce ticket URL and ticket/case number into the saved job's Salesforce Ticket Link section.

## Salesforce ticket linking

- No Salesforce API authorization is required for the current workflow.
- No Salesforce Connected App credentials are required for the current workflow.
- Create or find the ticket in Salesforce, copy its URL, then paste it into the Field Job modal.
- The optional ticket/case number is displayed as the `SF` badge on job cards.

## Future API sync

- The `salesforce-case` Supabase Edge Function is parked for future IT-approved API sync.
- When API sync is approved, configure the function with `SALESFORCE_LOGIN_URL`, `SALESFORCE_INSTANCE_URL`, `SALESFORCE_CONNECTED_APP_CONSUMER_KEY`, and `SALESFORCE_CONNECTED_APP_CONSUMER_SECRET`; keep these values out of `app-config.js`.
- `SALESFORCE_CONNECTED_APP_CONSUMER_KEY` is the Consumer Key from the Salesforce Connected App / External Client App. Salesforce may call this the client ID in OAuth docs, but it is not a dashboard client/customer ID.
- `SALESFORCE_CONNECTED_APP_CONSUMER_SECRET` is the Consumer Secret from that same Salesforce app.
- `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` are default Supabase Edge Function secrets. Do not set them manually with `supabase secrets set`.

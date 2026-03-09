# Lab WIP Dashboard

This project is now structured so it can live in a GitHub repository and run as a static site while storing shared data behind authenticated cloud access.

## Recommended architecture

- GitHub repository: source control and deployment target
- GitHub Pages: static hosting for `lab-dashboard.html` and `import.html`
- Supabase: centralized storage plus password-based user authentication

GitHub alone is not enough for shared runtime data or secure login. The app was originally browser-only and saved everything into each user's `localStorage`, so a backend service is required for centralized access.

## What changed

- `cloud-auth.js` adds a sign-in gate and provides a shared `window.storage` adapter.
- `app-config.js` is the runtime config file for the Supabase URL and anon key.
- `index.html` redirects GitHub Pages root traffic to `lab-dashboard.html`.
- `supabase/schema.sql` creates the shared storage table and access policies.

If `app-config.js` is left blank, the app stays in local browser mode so you can still use it before cloud setup is finished.

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


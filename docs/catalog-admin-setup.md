# Catalogue and owner-panel setup

The application uses **Supabase PostgreSQL + Auth** for product management and **Cloudinary** for product photos. The owner manages everything at `/admin`; they do not need the provider dashboards for routine changes.

This guide configures your own accounts. No accounts, secrets, database migrations, or functions are deployed automatically.

## 1. Install dependencies

From the project directory:

```sh
npm install
npm run dev
```

Node **22.12 or newer** is recommended for the current Vite toolchain. If Vite reports a different engine minimum, follow that requirement.

With no Supabase variables, the storefront shows a clearly labelled sample catalogue and `/admin` shows a setup checklist. Sample ordering is disabled. Configured projects never silently fall back to sample products after a database error.

## 2. Create the Supabase database

1. Create a Supabase project in a suitable region.
2. Open its **SQL Editor** and execute `supabase/migrations/001_catalog.sql` once. Alternatively, link the Supabase CLI and use `supabase db push`.
3. Keep `catalog_private` out of the exposed Data API schemas. Only `public` needs to be exposed.
4. Leave Row Level Security enabled on `public.products` and the private tables.

The migration creates:
- `public.products`, with published-only public reads and owner-only writes.
- `catalog_private.owners`, the private list of authorized Auth user UUIDs.
- `catalog_private.media`, a private registry for safe Cloudinary photo attachment/cleanup.
- Permission, sample-import, and server-only media functions.

The migration is intentionally **not an idempotent reset**. If a partial setup fails, inspect the database before retrying; do not delete existing catalogue data to make it pass.

### Create the owner account

1. In **Authentication → Users**, create the owner's email/password account or invite them.
2. Disable **Allow new users to sign up** in the Auth provider settings. The application has no registration page.
3. Copy that account's UUID.
4. Run the following in the SQL Editor, replacing the example UUID:

```sql
insert into catalog_private.owners(user_id)
values ('00000000-0000-0000-0000-000000000001'::uuid);
```

Do not use the example UUID literally. The email address or `user_metadata.role` does not grant owner privileges. Additional authorized owners can be enrolled with the same operation; removing their row revokes catalogue permissions.

## 3. Configure public frontend variables

Copy the root `.env.example` to `.env.local` and fill in:

```dotenv
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_PUBLISHABLE_KEY
```

Find these in the Supabase project connection/API settings. A legacy **anon** key can be supplied as `VITE_SUPABASE_ANON_KEY` instead; do not set a service-role key.

Restart Vite after changing env variables. On your production host, set these same two variables in the build environment and rebuild **once** to configure the app. Later catalogue changes do not require redeployment.

**Every `VITE_` value is public in the browser bundle. Never place a Cloudinary API secret, Cloudinary API key, Supabase secret key, or service-role key there.** Public Supabase keys are safe only with the supplied RLS and ownership rules in place.

## 4. Configure Cloudinary and the Edge Function

1. Create a Cloudinary account and note its **cloud name**, **API key**, and **API secret**.
2. Do not configure an unsigned upload preset for this feature.
3. In Supabase Edge Function secrets, set:

```dotenv
CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_API_KEY
CLOUDINARY_API_SECRET=YOUR_API_SECRET
CATALOG_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://YOUR-SITE.example
```

Origins are exact scheme/host/port values, comma-separated, **without trailing slashes**. Add only origins you control. Preview deployments need their own explicitly allowed origin. Remove development origins from production when you no longer need them.

Copy `supabase/.env.example` to a private file such as `supabase/.env.local` if using the CLI. That file is gitignored. Do not use the same file as the frontend `.env.local`.

Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to deployed functions. They are used only by the function and must never reach the frontend.

### Deploy with the Supabase CLI

Run these yourself after installing/authenticating the Supabase CLI:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set --env-file supabase/.env.local
supabase functions deploy catalog-media --no-verify-jwt
```

`supabase/config.toml` also sets `verify_jwt = false` for this function. **This does not make uploads public**: the handler explicitly calls `auth.getUser(bearerToken)`, then checks the private owner allowlist before every upload/cleanup. This accommodates projects using modern publishable keys/signing keys. Never remove those in-handler checks.

The function:
- accepts only authorized owner requests from allowed origins;
- bounds upload request sizes and validates image MIME, signature and dimensions;
- generates random application-owned Cloudinary IDs under `catalog/`;
- signs/uploads on the server without exposing API credentials;
- registers successful assets before they can be attached to a product;
- refuses deletion of assets still referenced by any product.

Cloudinary's photo delivery URLs are public: a draft/hidden **product record** is private, but someone who already knows a photo URL can still view that photo. Do not upload confidential documents or private customer photos through this catalogue.

Cloudinary credentials should remain stable after products have been uploaded. Changing to another cloud requires an intentional image migration; the application will not delete assets from a different cloud.

## 5. Password reset and hosting

The database/function are authoritative, but a browser-only admin session is still sensitive. Do not add untrusted third-party scripts to the site; enable MFA for the owner's accounts where available and use HTTPS in production.

In Supabase **Authentication → URL Configuration**:
- Set the **Site URL** to your production site.
- Add exact reset redirect URLs:
  - `http://localhost:5173/admin/recovery`
  - `http://127.0.0.1:5173/admin/recovery`
  - `https://YOUR-SITE.example/admin/recovery`

Configure Auth email delivery (custom SMTP recommended for production). Default email services commonly have low quotas. Reset links use PKCE; open the email link in the **same browser that requested it**. If expired or opened in another browser, request a fresh link there.

This is still a static React single-page application. Configure your host so unknown routes serve `index.html`, including `/admin`, `/admin/recovery`, and `/shop/:slug`. Keep `/admin` out of sitemaps; it also sets `noindex`, but **authorization is enforced by the database/function, not indexing rules or the hidden URL**.

## 6. Owner's everyday workflow

1. Open `/admin` and sign in.
2. Click **Add product** or **Edit**.
3. Enter product details, category, price and optional photo.
4. Choose:
   - **Draft**: private, unfinished product.
   - **Published**: visible to customers.
   - **Hidden**: off the storefront without deleting the record.
5. Set **Sold out** to keep a product visible but prevent ordering.
6. Click **Save product / Save & publish**.

A blank price with **Price on enquiry** enabled displays enquiry wording. Numeric INR prices support two decimal places. The URL is generated for new products and stays stable when an existing product is renamed. Use `Jewellery` as the category for the existing jewellery styling and fields. Featured published products appear on the homepage.

The initial layout supports **one primary photo per product**. JPEG/PNG/WebP uploads up to 5 MB are resized to at most 1600 × 2000 pixels and compressed into a still photo in the browser; HEIC/SVG files are not accepted. Cloudinary serves optimized sizes for cards, product pages and bag thumbnails. Without a photo, generated artwork is used.

If the catalogue is empty, **Import sample drafts** can populate the existing placeholder records privately. Replace/check all facts before publishing; samples are never published automatically and imports cannot overwrite existing records.

### What customers see after updates

The catalogue reloads on navigation/focus and after owner changes. Customers see updates on their next successful fetch; constantly open background tabs are not promised instant push updates. Published product prices and availability are checked again before sending/copying an order. If something changed, the customer must review the updated bag. The final send/copy is a second direct click so browser popup/clipboard restrictions do not interfere. A verified order expires after one minute and the studio still confirms final stock and price on WhatsApp.

Saved bag IDs are retained while loading/offline. Missing, hidden/deleted or sold-out products are removed **only after a successful catalogue fetch**, with a notice. No payment or guaranteed inventory reservation is implemented.

## 7. Image cleanup and backups

- Replaced photos are cleaned only **after the new product record saves**. Deleting a product likewise removes the database record before attempting photo cleanup.
- Cleanup failures are warnings: a successful catalogue save must not be retried as if it failed. Use **Clean unused photos** later.
- Cancellation attempts to remove unattached uploads. Browser crashes/abrupt closes may leave them behind.
- **Clean unused photos** processes up to five registered, unreferenced photos older than one hour per click. Repeat if more remain. Do not run it while preparing a long-lived unsaved editor in another tab; a photo cleaned as unused must be uploaded again before that draft can save.
- A cleanup lease prevents concurrent attachment while deletion is pending. If Cloudinary is temporarily unavailable, wait at least five minutes and retry.
- On rare failures between Cloudinary upload and database registration, an asset may not be in the registry. Inspect the `catalog/` folder in Cloudinary and compare with database references before deleting anything manually. Never mass-delete the application folder.
- **Export catalogue backup** downloads product records and image references, not original photo bytes. This is a record export, not an automatic restore tool. Keep original photos separately (Google Drive is fine for that) and maintain Supabase database exports/backups.

Free-tier quotas change. Confirm current storage, bandwidth, transformation, inactivity and email limits with your providers; compressing photos helps but does not make usage unlimited.

## 8. Verification

### Local automated checks

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

The browser tests launch the actual Vite app and mock Supabase/Cloudinary responses locally; **they do not provision accounts or test your deployed RLS**. They check owner CRUD, price changes, primary-photo upload, non-owner denial, mobile layout, and the customer order flow. Screenshots are written to `test-results/`.

For an optional server-side TypeScript/runtime check, install Deno and run:

```sh
deno check supabase/functions/catalog-media/index.ts
```

### Required live checks after configuration

Use a small disposable test product/photo; do not use real customer data:

- [ ] Anonymous visitors can fetch published products but cannot see drafts/hidden products.
- [ ] Anonymous and ordinary non-owner accounts cannot insert, update or delete product records **even via direct API requests**.
- [ ] Ordinary accounts cannot call server-only media RPCs, query the private owner/media tables, or grant themselves ownership.
- [ ] Owner can create a draft, upload a photo, edit the price, publish, hide, mark sold out, and delete it.
- [ ] Anonymous/expired/non-owner tokens cannot upload or delete photos through the function.
- [ ] Unexpected origins are rejected; your local and production origins work.
- [ ] A referenced photo cannot be deleted; replacements retain the old photo until the save succeeds.
- [ ] Customer bag uses the current price; hidden/deleted/sold-out items are removed with a notice after a successful refresh.
- [ ] Offline/errors preserve saved bag IDs and block unverified order sending.
- [ ] Password reset succeeds in the requesting browser and `/admin/recovery` survives a full-page load on your host.
- [ ] No Cloudinary secret/service-role key appears in frontend env files, Git, or built assets.

**Do not launch the owner feature until the live permissions and upload checks pass.** Tests with mocked responses cannot certify a configured Supabase project or deployed function.

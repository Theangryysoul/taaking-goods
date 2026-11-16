# Taaking Goods

The storefront for Taaking Goods, a small batch resin studio in India with a separate hallmarked gold and silver jewellery collection. The site is built to show the work clearly, explain how an order happens, and hand the conversation to WhatsApp rather than pretending to be a checkout.

Live pieces are not sold on the site. A visitor builds a bag, adds delivery details, and sends the order to the studio on WhatsApp. The studio confirms stock, shipping, the final price, and for jewellery, the purity, weight, and making charges before any payment.

## Brand theme: Teal Luxe (dark)

The site uses the studio's Teal Luxe brand board (`Taaking Goods Teal Luxe Brand Board.png`):

| Role | Colour | Token |
| --- | --- | --- |
| Background | Charcoal `#0B0F14` | `--sand-0` |
| Primary | Deep Teal `#0E6B72` | `--teal` |
| Accent / CTA | Aqua `#20C4C7` | `--aqua` |
| Text / icons | Silver `#D1D5DB` | `--ink-700` |
| Text (bright) | Ivory `#F6F7F5` | `--ink-900` |
| Surfaces | `#10161C`, `#1A2127`, `#284046` | `--sand-50/100/200` |

**Jewellery-only golds** — champagne gold `#D4B47C` (`--gold`) and midnight gold `#9C7C3C` (`--gold-deep`) are used *only* inside the jewellery category: card badges, the product hallmark note, the shop jewellery panel, and the home jewellery band. Resin sections stay teal/aqua. Do not use the gold tokens outside jewellery contexts.

The logo (`Taaking Goods Logo.png`, copied to `public/logo.png`) is used in the nav, footer, favicon, social preview, and structured data. Swap `public/logo.png` to update it everywhere at once (`src/components/Wordmark.jsx` renders it).

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # preview the production build
```

Node 22.12 or newer is recommended for the current Vite toolchain.

Catalogue checks: `npm test`, `npm run build`, and `npm run test:browser` (install Chromium first with `npx playwright install chromium`). The browser checks use local service mocks; follow the setup guide's live RLS/upload checklist before launch.

## Stack

- React 19 with Vite 8
- React Router 7 (client side routes)
- Lenis for smooth scrolling
- Three.js for the one interactive resin object on the home page
- Manrope (variable) as the only typeface
- Phosphor icons
- Supabase PostgreSQL/Auth for the live catalogue and owner panel
- Cloudinary photos through an authenticated Supabase Edge Function
- Vitest/React Testing Library and Playwright for catalogue checks
- Plain CSS with design tokens, no UI framework

## What to replace before launch

Everything that is specific to the studio lives in a small number of files. You should not need to touch the components for ordinary content changes.

### 1. Studio details: `src/config.js`

| Field       | What to do                                                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `whatsapp`  | Digits only, including country code. Set to `918708358441`. WhatsApp receives orders; it is not shown as a social link.                |
| `instagram` | `https://www.instagram.com/taaking_goods/` — footer and contact page.                                                                    |
| `facebook`  | `https://www.facebook.com/taakinggoods` — footer and contact page.                                                                       |
| `email`     | `taakinggoods@gmail.com` — footer and contact page.                                                                                      |
| `domain`    | The canonical domain used by page metadata.                                                                                             |

When `whatsapp` is empty:

- the bag offers **Copy order details** instead of a dead WhatsApp button;
- the contact form opens an email to the address above;
- the contact page explains that WhatsApp is being connected;
- every other call to action stays useful.

Set the number and all of these paths switch to WhatsApp automatically.

### 2. Owner-managed catalogue

The owner can manage products, prices, visibility, availability, featured pieces and a primary photo at **`/admin`**. Supabase provides PostgreSQL and owner authentication; Cloudinary provides image delivery through an authenticated Supabase Edge Function.

**Setup:** [Catalogue and owner-panel setup](docs/catalog-admin-setup.md). Apply the database migration, create/enrol the owner, configure the public frontend variables, and set Cloudinary secrets on the server function. No accounts or remote services are configured automatically.

- With no Supabase variables, `src/data/catalog.js` is used only as a labelled sample catalogue. Sample ordering is disabled.
- With Supabase configured, public pages read published database products. Database failures never silently fall back to samples.
- Draft/hidden products are owner-only; sold-out published products remain visible but cannot be ordered.
- Routine updates require no code changes or redeployments.
- The owner can explicitly import samples as **private drafts** into an empty catalogue. Replace placeholder facts before publishing.

Product fields include name, stable URL, category, INR price or Price on enquiry, descriptions, detail lines, generated-art fallback, featured flag, publication status, availability, and Jewellery metal/hallmark fields.

### 3. Photographs

Upload JPEG, PNG or WebP photos in the owner editor (up to 5 MB). The app resizes large images and uploads them through the owner-authorized server function; no Cloudinary secrets are exposed to the browser. Cloudinary serves optimized sizes for cards, product pages and bags.

The current layout supports **one primary photo per product**. No photo (or failed image delivery) falls back to generated artwork. Keep original photographs separately; Google Drive is suitable as an original-photo archive, not as the storefront's image host.

Useful image specs:

- 4:5 portrait, up to 1600 × 2000 px
- JPEG/WebP, ideally under 300 KB
- plain background and soft daylight
- piece centred; cards crop from the centre

Photo replacement cleanup happens after a successful save. The owner panel offers **Clean unused photos** and **Export catalogue backup**; see the setup guide for quotas, cleanup caveats and live access-control checks.

### 4. Copy: `src/data/content.js`

Studio story, process steps, care notes, FAQs, and the contact intro. The current text is written to be plausible and specific, but it should be read and adjusted to the studio's actual practice.

### 5. Policies: `src/data/legal.js`

Privacy, terms, and shipping and returns are drafted as reviewable starting points. Please have them checked against how the studio actually operates before launch.

In particular:

- the 48 hour damage window;
- the 75% advance confirms / 30%-deduction return policy;
- hallmarks and their significance;
- the statement that custom and made to order pieces are not returnable;
- the tax and accounting retention period in the privacy policy;
- the governing law and liability wording.

These are placeholders in substance, even though they are written carefully.

### 6. Facts to confirm

A few lines of sample copy sound like studio facts. Please confirm or rewrite them:

- the studio is described only as "in India"; add a city if you want one;
- the WhatsApp number is `+91 87083 58441` (digits `918708358441`);
- Instagram: `taaking_goods`;
- Facebook: `taakinggoods`;
- email: `taakinggoods@gmail.com`;
- the 48 hour damage window and the new return rules (30% deduction, selected pieces only);
- gift wrapping being confirmed on WhatsApp;
- dispatch and delivery timelines;
- the email address, domain, and social handles.

Nothing on the site invents a price, review, customer count, award, or press mention. The catalogue is clearly marked as a sample in the source, and every price reads **Price on enquiry** until real prices are supplied. This is better than a page full of numbers the studio has to walk back later.

### 7. Social preview: `public/logo.png`

The Open Graph and Twitter preview images point at the studio logo (`public/logo.png`). Replace it with a 1200 × 630 branded banner when one is ready, and update the `og:image` / `twitter:image` paths in `index.html` to match.

### 8. Three.js / jewellery visual

The home page has one interactive 3D piece: a translucent deep-teal torus knot on the charcoal stage, matching the brand board's hero. It can be dragged, respects `prefers-reduced-motion`, lazy loads, and falls back to generated artwork if WebGL is unavailable.

Jewellery pieces use generated metal artwork (`JewelleryArt.jsx`) kept separate from the resin `ResinArt.jsx`. Do not use resin shapes for hallmarked metal.

### 9. Design notes

- Dark Teal Luxe direction: charcoal background, deep teal primary, aqua CTA, silver/ivory text (see the brand table at the top).
- Jewellery category carries its own champagne/midnight gold accents; resin stays teal/aqua.
- One typeface, Manrope, with a named type scale in `tokens.css`.
- Flat surfaces. The only gradients are the heading text treatment, the aqua CTA fill, and the product artwork itself.
- The home page has one interactive 3D piece: a translucent deep-teal torus knot.
- The custom cursor is disabled on touch devices and when reduced motion is requested.
- Reveal animations use `IntersectionObserver` and are skipped when reduced motion is requested.
- Items that start below the fold stay available to crawlers and to browsers that do not run the animation.

## Accessibility and performance

The original storefront includes the following accessibility/performance patterns. Bundle-size figures describe the original static build; remeasure after adding Supabase and the owner panel.

- Skip link, visible focus styles, labelled icon buttons, and native `<dialog>` for the bag.
- The mobile menu traps the page behind it, closes on Escape, and restores focus.
- Form errors are announced and tied to their fields with `aria-describedby`.
- The Three.js chunk is split out and loaded only on the home page.
- Built output is roughly 120 KB gzipped for the app plus 135 KB gzipped for the 3D chunk, with fonts self hosted.
- All routes have their own title, description, and canonical URL. The home page also emits FAQ structured data.

## Deployment

The site is a static single page app. Any static host works.

- Build command: `npm run build`
- Publish directory: `dist`
- Add a rewrite so all routes serve `index.html` (React Router handles `/shop/:slug`, `/about`, and the rest).

On Netlify, a `_redirects` file with `/* /index.html 200` is enough. On Vercel, use a catch all rewrite to `/index.html`. On Cloudflare Pages, the default SPA behaviour handles it.

## Deliberate omissions

There are no invented prices, review counts, customer logos, press mentions, or newsletter forms. The catalogue is clearly marked as a sample in the source, and every price reads **Price on enquiry** until real prices are supplied. This is better than a page full of numbers the studio has to walk back later.

## Original storefront checks

The checks below describe the original static storefront, **not verification of the new owner panel or live integrations**. Run the new automated checks and the setup guide's live permissions checklist after configuring the services.

- Production build passes.
- Layout checked at 320, 360, 390, 480, 640, 768, 900, 1024, 1180, 1280, 1440, and 1728 px with no horizontal overflow.
- Bag validation, quantity limits, remove, persistence, Escape to close, and focus return tested.
- Filters, accordions, mobile menu, skip link, and reduced motion tested.
- No console errors beyond WebGL driver notices from the headless test browser.

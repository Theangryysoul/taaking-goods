# Taaking Goods

The storefront for Taaking Goods, a small batch resin studio in India. The site is built to show the work clearly, explain how an order happens, and hand the conversation to WhatsApp rather than pretending to be a checkout.

Live pieces are not sold on the site. A visitor builds a bag, adds delivery details, and sends the order to the studio on WhatsApp. The studio confirms stock, shipping, and the final price before any payment.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
npm run preview  # preview the production build
```

Node 20 or newer is recommended.

## Stack

- React 19 with Vite 8
- React Router 7 (client side routes)
- Lenis for smooth scrolling
- Three.js for the one interactive resin object on the home page
- Manrope (variable) as the only typeface
- Phosphor icons
- Plain CSS with design tokens, no UI framework

## What to replace before launch

Everything that is specific to the studio lives in a small number of files. You should not need to touch the components for ordinary content changes.

### 1. Studio details: `src/config.js`

| Field | What to do |
| --- | --- |
| `whatsapp` | Digits only, including country code. Example: `919876543210`. Until it is set, the site falls back to email and copyable order details. |
| `instagram` | Full profile URL, or leave empty to hide the Instagram links. |
| `email` | The address that should receive enquiries. |
| `domain` | The canonical domain used by page metadata. |

When `whatsapp` is empty:

- the bag offers **Copy order details** instead of a dead WhatsApp button;
- the contact form opens an email to the address above;
- the contact page explains that WhatsApp is being connected;
- every other call to action stays useful.

Set the number and all of these paths switch to WhatsApp automatically.

### 2. Products: `src/data/catalog.js`

Each entry has the following shape:

```js
{
  id: "sandbar-coasters",
  slug: "sandbar-coaster-set",
  name: "Sandbar coaster set",
  category: "Tableware",          // must be one of the categories array
  price: 1450,                    // rupees, or null for "Price on enquiry"
  art: { shape: "coaster", palette: "amber" },
  image: "/images/sandbar-coasters.jpg", // optional, see below
  summary: "One line for the card and product page.",
  description: "The longer note beside the product.",
  details: ["Set of four", "Approx 9 cm × 9 cm"],
  featured: true                  // shows on the home page
}
```

To add a product, copy an entry and give it a unique `id` and `slug`. The category filter and related products update themselves.

### 3. Photographs

The site currently uses original generated resin artwork so that it looks complete without stock imagery. When the real photographs are ready:

1. Put the files in `public/images/`.
2. Add `image: "/images/your-file.jpg"` to the product in `src/data/catalog.js`.

That is all. The generated artwork steps aside, and the same image is used on the product card, the product page, and in the bag.

Useful image specs:

- 4:5 portrait, around 1600 × 2000 px is plenty
- JPEG or WebP, ideally under 300 KB each
- shoot on a plain wall or stone surface, in soft daylight
- keep the piece in the centre; cards crop from the centre
- one image per piece is enough for this layout

### 4. Copy: `src/data/content.js`

Studio story, process steps, care notes, FAQs, and the contact intro. The current text is written to be plausible and specific, but it should be read and adjusted to the studio's actual practice.

### 5. Policies: `src/data/legal.js`

Privacy, terms, and shipping and returns are drafted as reviewable starting points. Please have them checked against how the studio actually operates before launch. In particular:

- the 48 hour damage window;
- the 7 day return window for unused ready pieces;
- the statement that custom and made to order pieces are not returnable;
- the tax and accounting retention period in the privacy policy;
- the governing law and liability wording.

These are placeholders in substance, even though they are written carefully.

### 6. Facts to confirm

A few lines of sample copy sound like studio facts. Please confirm or rewrite them:

- the studio is described only as "in India"; add a city if you want one;
- "A few pieces are in the studio now" on the home page;
- the 48 hour damage window and the 7 day return window;
- gift wrapping being confirmed on WhatsApp;
- dispatch and delivery timelines;
- the email address, domain, and Instagram handle.

Nothing on the site invents a price, review, customer count, award, or press mention.

### 7. Social preview: `public/og.png`

The Open Graph image is already generated at 1200 × 630. Replace it when the photographs are ready, keeping the same dimensions and file name. Keep `og:image:width` and `og:image:height` in `index.html` in sync if you change the dimensions.

## Project map

```
src/
  config.js              studio details and WhatsApp helpers
  data/
    catalog.js           products, categories, helpers
    content.js           home, about, contact, FAQ copy
    legal.js             policy drafts
  pages/                 Home, Shop, Product, About, Contact, legal, 404
  components/            nav, footer, bag, cursor, reveal, 3D stage, art
  context/CartContext    bag state, persistence, totals
  lib/                   price formatting, order message, clipboard, scrolling
  hooks/                 page metadata, card tilt
  styles/
    tokens.css           colour, spacing, radius, type scale
    base.css             reset, typography, shared primitives
    components.css       nav, cards, bag, footer, 3D stage
    pages.css            page layouts and responsive rules
public/
  images/                studio photographs (add your own)
  og.png                 social preview
  favicon.svg
```

## How the order flow works

1. A piece is added to the bag, which is persisted in `localStorage`.
2. The bag asks for name, city, and a six digit pincode. The note is optional.
3. With a WhatsApp number configured, **Send order on WhatsApp** opens `wa.me` with a formatted message.
4. Without a number, **Copy order details** copies the same message so it can be pasted anywhere.
5. No card details, no payment provider, no server. Nothing leaves the browser until the visitor sends the message.

The message is assembled in `src/lib/order.js`. If you want to change its order or wording, that is the file.

## Design notes

- Light editorial direction: sand, stone, ink, olive, amber, clay.
- One typeface, Manrope, with a named type scale in `tokens.css`.
- Flat backgrounds. The only gradients are the heading text treatment and the resin artwork itself.
- The home page has one interactive 3D piece: a translucent amber torus knot. It can be dragged, respects `prefers-reduced-motion`, lazy loads, and falls back to generated artwork if WebGL is unavailable.
- The custom cursor is disabled on touch devices and when reduced motion is requested.
- Reveal animations use `IntersectionObserver` and are skipped when reduced motion is requested.
- Items that start below the fold stay available to crawlers and to browsers that do not run the animation.

## Accessibility and performance

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

## Checks already run

- Production build passes.
- Layout checked at 320, 360, 390, 480, 640, 768, 900, 1024, 1180, 1280, 1440, and 1728 px with no horizontal overflow.
- Bag validation, quantity limits, remove, persistence, Escape to close, and focus return tested.
- Filters, accordions, mobile menu, skip link, and reduced motion tested.
- No console errors beyond WebGL driver notices from the headless test browser.

# Slek Sar Storefront

## What this is
A React + Vite storefront wired to your existing Supabase backend
(create-order, submit-payment-proof, and product data) — matching the
design you specified: white background, black-framed product images,
black info panel with white text, green "Add to Cart" button that
inverts on hover, and a 2-col/1-col grid toggle for mobile.

## Pages
- **Shop** — product grid, reads live products from your `products` table
- **Cart** — quantity adjust, totals with flat delivery fee
- **Checkout** — customer info form, calls `create-order`
- **Payment** — QR placeholder + screenshot upload, calls `submit-payment-proof`
- **Confirmation** — simple thank-you screen

## Before running locally
1. Install dependencies: `npm install`
2. Create a `.env` file in this folder with:
   ```
   VITE_SUPABASE_URL=https://morbdfqfeqsasytyrpkn.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```
   (Same Supabase project URL and anon/publishable key you've used
   throughout this project — find them in Settings > API.)
3. Run: `npm run dev`

## Deploying to Vercel
1. Push this folder to a GitHub repo (or drag-and-drop deploy via
   Vercel's dashboard)
2. In Vercel, add the same two environment variables
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) under
   Project Settings > Environment Variables
3. Deploy — Vercel auto-detects Vite projects, no extra config needed
4. Once live, copy your Vercel URL and set it as the `SHOP_BASE_URL`
   secret in Supabase (Settings > Edge Functions > Secrets) — this is
   the step we deferred earlier in the project

## Still needed before this is "real"
- Replace the QR placeholder in `src/components/Payment.jsx` with your
  actual payment QR image
- Add real products via SQL or (once built) the admin panel
- Test the full flow with a real Telegram-linked token from `?token=...`
  in the URL

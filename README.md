# PaisaTrack SaaS foundation

## Included
- Supabase schema for profiles, personal/group wallets, members, transactions, subscriptions and billing event audit.
- RLS policies for private personal wallets and shared group wallets.
- Roles: owner, editor, viewer.
- Signup trigger creates a profile, private personal wallet and 15-day trial.
- RPCs to create a shared group, join by invite code, record explicit auto-renew consent, and request cancellation.
- Supabase client helpers using the anon key and RLS.

## Setup
1. Create a Supabase project.
2. Run `supabase/migrations/001_paisatrack_saas.sql` in Supabase SQL Editor.
3. Copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Run `npm install` then `npm run dev`.

## Subscription rules
Price: ₹100 per individual per month. Trial: 15 days. Consent must be explicit and recorded before setting up recurring billing. The consent RPC only records consent; it does not charge money or create a payment mandate. If the user does not consent or does not complete the provider mandate, do not charge them.

## Important implementation boundary
This package implements the database schema, RLS, wallet roles and subscription lifecycle records. It does not yet connect a payment provider, implement authentication screens, or replace the original dashboard's localStorage transaction logic with cloud persistence. Those are the next frontend/backend integration tasks.

Before production:
- Add sign-up, sign-in, password reset and email verification UI.
- Wire dashboard CRUD to `src/lib/data.js`.
- Add an Edge Function to create a payment-provider subscription/mandate after consent.
- Verify payment webhooks server-side; only trusted server events may update paid status.
- Enforce subscription entitlements server-side.
- Test RLS with multiple users and each role.
- Add privacy policy, terms, cancellation flow, data export/deletion, rate limits and backups.
- Never expose Supabase service-role or payment-provider secret keys in frontend code.

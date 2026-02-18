# Stripe & Subscription Setup

## 1. Supabase Schema Changes

Run this SQL in your Supabase dashboard (SQL Editor):

```sql
-- Add subscription fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
```

## 2. Stripe Account Setup

1. Create a Stripe account at https://dashboard.stripe.com
2. Create a Product called "Embers Premium" with a $9.99/month recurring price
3. Copy the **Price ID** (starts with `price_`)

## 3. Environment Variables

Add these to your `.env.local`:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_ID=price_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

- `STRIPE_SECRET_KEY` — From Stripe Dashboard > Developers > API keys
- `STRIPE_WEBHOOK_SECRET` — From Stripe Dashboard > Developers > Webhooks (see step 4)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — From Stripe Dashboard > Developers > API keys
- `STRIPE_PRICE_ID` — The Price ID from step 2
- `SUPABASE_SERVICE_ROLE_KEY` — From Supabase Dashboard > Settings > API (needed for webhook to update user records)

## 4. Stripe Webhook Setup

### For Local Development

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret it displays and add it as `STRIPE_WEBHOOK_SECRET`.

### For Production

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-domain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the signing secret to your production `STRIPE_WEBHOOK_SECRET`

## 5. Test the Flow

1. Start the dev server: `npm run dev`
2. Go to `/pricing` — you should see Free vs Premium plans
3. Sign in, click "Upgrade to Premium"
4. Use Stripe test card: `4242 4242 4242 4242` (any future date, any CVC)
5. After checkout, your `users` table should show `subscription_tier: 'premium'`

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events to update user subscription status.
 * Events handled:
 * - checkout.session.completed → activate premium
 * - customer.subscription.updated → sync status changes
 * - customer.subscription.deleted → revert to free
 */
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Stripe] STRIPE_WEBHOOK_SECRET is not set.');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('[Stripe] Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Use service role client for admin operations
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Stripe] Supabase service role credentials missing.');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (!userId) {
          console.error('[Stripe] No userId in checkout session');
          break;
        }

        // Get subscription details for expiration date
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const periodEnd = (sub as any).current_period_end as number;

        const { error } = await supabase
          .from('users')
          .update({
            subscription_tier: 'premium',
            stripe_customer_id: customerId,
            subscription_expires_at: new Date(periodEnd * 1000).toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error('[Stripe] Failed to update user subscription:', error);
        } else {
          console.log(`[Stripe] User ${userId} upgraded to premium`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sub = event.data.object as any;
        const customerId = sub.customer as string;

        const isActive = sub.status === 'active' || sub.status === 'trialing';
        const tier = isActive ? 'premium' : 'free';

        const { error } = await supabase
          .from('users')
          .update({
            subscription_tier: tier,
            subscription_expires_at: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_customer_id', customerId);

        if (error) {
          console.error('[Stripe] Failed to update subscription status:', error);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const { error } = await supabase
          .from('users')
          .update({
            subscription_tier: 'free',
            subscription_expires_at: null,
          })
          .eq('stripe_customer_id', customerId);

        if (error) {
          console.error('[Stripe] Failed to revert subscription:', error);
        } else {
          console.log(`[Stripe] Customer ${customerId} reverted to free`);
        }
        break;
      }

      default:
        // Ignore unhandled event types
        break;
    }
  } catch (error) {
    console.error('[Stripe] Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

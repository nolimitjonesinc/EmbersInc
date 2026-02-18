import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { requireAuth } from '@/lib/auth/getAuthContext';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * POST /api/stripe/portal
 *
 * Creates a Stripe Customer Portal session for managing subscriptions.
 * User can update payment methods, cancel, or view invoices.
 */
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Payment system is not configured.' },
      { status: 503 }
    );
  }

  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    // Get the user's Stripe customer ID from Supabase
    const supabase = await getSupabaseServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    const stripeCustomerId = profile?.stripe_customer_id as string | undefined;
    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: 'No subscription found. You can upgrade from the pricing page.' },
        { status: 404 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${request.nextUrl.origin}/profile`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[Stripe] Portal session creation failed:', error);
    return NextResponse.json(
      { error: 'Could not open subscription management. Please try again.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { requireAuth } from '@/lib/auth/getAuthContext';

export const runtime = 'nodejs';

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout session for the premium tier.
 * Requires authentication — anonymous users must sign up first.
 */
export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Payment system is not configured.' },
      { status: 503 }
    );
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    console.error('[Stripe] STRIPE_PRICE_ID is not set.');
    return NextResponse.json(
      { error: 'Payment system is not configured.' },
      { status: 503 }
    );
  }

  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${request.nextUrl.origin}/conversation?upgraded=true`,
      cancel_url: `${request.nextUrl.origin}/pricing`,
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: {
        userId: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[Stripe] Checkout session creation failed:', error);
    return NextResponse.json(
      { error: 'Could not start checkout. Please try again.' },
      { status: 500 }
    );
  }
}

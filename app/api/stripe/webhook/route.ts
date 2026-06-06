import { NextResponse, type NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        console.log(
          `Payment succeeded: ${pi.id} — $${(pi.amount / 100).toFixed(2)}`
        );
        // TODO: Insert into earnings table via Supabase service role
        break;
      }
      case "account.updated": {
        const account = event.data.object;
        console.log(`Account updated: ${account.id}`);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

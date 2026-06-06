import { NextResponse, type NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelName, email } = body;

    if (!channelName || !email) {
      return NextResponse.json(
        { error: "Channel name and email are required" },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        url: "#",
        message: "Stripe not configured — demo mode",
        account_id: "demo_account",
      });
    }

    const stripe = getStripe();
    const account = await stripe.accounts.create({
      type: "express",
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: channelName,
        product_description: `AI-hosted channel on NOVELA: ${channelName}`,
      },
    });

    const origin = request.headers.get("origin") || "http://localhost:3000";

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/?tab=channels`,
      return_url: `${origin}/?tab=channels&onboarded=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLink.url,
      account_id: account.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

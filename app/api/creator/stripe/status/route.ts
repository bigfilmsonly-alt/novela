import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function GET() {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({
        connected: false,
        message: "Supabase not configured — demo mode",
      });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's channel
    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .select("id, stripe_account_id")
      .eq("owner_id", user.id)
      .single();

    if (channelError || !channel) {
      return NextResponse.json(
        { error: "You do not have a channel" },
        { status: 404 }
      );
    }

    if (!channel.stripe_account_id) {
      return NextResponse.json({
        connected: false,
        details_submitted: false,
        charges_enabled: false,
        payouts_enabled: false,
      });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        connected: true,
        details_submitted: false,
        charges_enabled: false,
        payouts_enabled: false,
        message: "Stripe not configured — demo mode",
      });
    }

    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(
      channel.stripe_account_id
    );

    return NextResponse.json({
      connected: true,
      account_id: account.id,
      details_submitted: account.details_submitted,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      country: account.country,
      default_currency: account.default_currency,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

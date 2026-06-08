import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({
        url: "#",
        account_id: "demo_account",
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
      .select("id, name, stripe_account_id")
      .eq("owner_id", user.id)
      .single();

    if (channelError || !channel) {
      return NextResponse.json(
        { error: "You do not have a channel. Create one first." },
        { status: 404 }
      );
    }

    // If channel already has a Stripe account, create a new onboarding link for it
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        url: "#",
        account_id: "demo_account",
        message: "Stripe not configured — demo mode",
      });
    }

    const stripe = getStripe();
    const origin = request.headers.get("origin") || "http://localhost:3005";
    let accountId = channel.stripe_account_id;

    if (!accountId) {
      // Create a new Stripe Express Connect account
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: channel.name,
          product_description: `AI-hosted channel on Versa TV: ${channel.name}`,
        },
      });

      accountId = account.id;

      // Save the Stripe account ID to the channel
      const { error: updateError } = await supabase
        .from("channels")
        .update({ stripe_account_id: accountId })
        .eq("id", channel.id);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to link Stripe account to channel" },
          { status: 500 }
        );
      }
    }

    // Create an account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/creator?stripe=refresh`,
      return_url: `${origin}/creator?stripe=connected`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLink.url,
      account_id: accountId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

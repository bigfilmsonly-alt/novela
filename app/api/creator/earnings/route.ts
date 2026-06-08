import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEMO_EARNINGS = {
  total_cents: 245000,
  this_month_cents: 38500,
  pending_cents: 12000,
  transaction_count: 142,
  recent: [],
};

export async function GET() {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(DEMO_EARNINGS);
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
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (channelError || !channel) {
      return NextResponse.json(
        { error: "You do not have a channel" },
        { status: 404 }
      );
    }

    // Total earnings (all time)
    const { data: allEarnings, error: earningsError } = await supabase
      .from("earnings")
      .select("amount_cents, platform_fee_cents, created_at")
      .eq("channel_id", channel.id);

    if (earningsError) {
      return NextResponse.json(
        { error: earningsError.message },
        { status: 500 }
      );
    }

    const earnings = allEarnings || [];

    // Calculate totals
    const totalCents = earnings.reduce((sum, e) => sum + e.amount_cents, 0);
    const totalFeeCents = earnings.reduce(
      (sum, e) => sum + e.platform_fee_cents,
      0
    );

    // This month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEarnings = earnings.filter(
      (e) => new Date(e.created_at) >= monthStart
    );
    const thisMonthCents = thisMonthEarnings.reduce(
      (sum, e) => sum + e.amount_cents,
      0
    );
    const thisMonthFeeCents = thisMonthEarnings.reduce(
      (sum, e) => sum + e.platform_fee_cents,
      0
    );

    // Recent transactions (last 20)
    const { data: recent } = await supabase
      .from("earnings")
      .select("*, episodes(title, drama_id, dramas(title))")
      .eq("channel_id", channel.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      total_cents: totalCents,
      total_fee_cents: totalFeeCents,
      total_net_cents: totalCents - totalFeeCents,
      this_month_cents: thisMonthCents,
      this_month_fee_cents: thisMonthFeeCents,
      this_month_net_cents: thisMonthCents - thisMonthFeeCents,
      transaction_count: earnings.length,
      recent: recent || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

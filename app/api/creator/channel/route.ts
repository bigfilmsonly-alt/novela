import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Channel } from "@/lib/types";

const DEMO_CHANNEL: Channel = {
  id: "demo-channel-id",
  owner_id: "demo-user-id",
  name: "Demo Channel",
  slug: "demo-channel",
  description: "A demo creator channel on Versa TV",
  avatar_url: null,
  stripe_account_id: null,
  subscriber_count: 0,
  is_verified: false,
  created_at: new Date().toISOString(),
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function GET() {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(DEMO_CHANNEL);
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: channel, error } = await supabase
      .from("channels")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!channel) {
      return NextResponse.json({ channel: null });
    }

    return NextResponse.json(channel);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({
        ...DEMO_CHANNEL,
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

    // Check if user already has a channel
    const { data: existing } = await supabase
      .from("channels")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You already have a channel" },
        { status: 409 }
      );
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { error: "Channel name is required" },
        { status: 400 }
      );
    }

    // Generate slug from name or use provided slug
    let slug = body.slug ? slugify(body.slug) : slugify(name);

    // Ensure slug uniqueness by appending random suffix if taken
    const { data: slugCheck } = await supabase
      .from("channels")
      .select("id")
      .eq("slug", slug)
      .single();

    if (slugCheck) {
      const suffix = Math.random().toString(36).slice(2, 7);
      slug = `${slug}-${suffix}`;
    }

    const description =
      typeof body.description === "string" ? body.description.trim() : null;

    const { data: channel, error } = await supabase
      .from("channels")
      .insert({
        owner_id: user.id,
        name,
        slug,
        description,
        avatar_url:
          typeof body.avatar_url === "string" ? body.avatar_url.trim() : null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "A channel with that slug already exists" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({
        ...DEMO_CHANNEL,
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

    // Find the user's channel
    const { data: channel, error: findError } = await supabase
      .from("channels")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (findError || !channel) {
      return NextResponse.json(
        { error: "You do not have a channel" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: Record<string, string | null> = {};

    if (typeof body.name === "string") {
      updates.name = body.name.trim();
    }
    if (typeof body.description === "string") {
      updates.description = body.description.trim();
    }
    if (typeof body.avatar_url === "string") {
      updates.avatar_url = body.avatar_url.trim();
    }
    if (typeof body.slug === "string") {
      const newSlug = slugify(body.slug);
      if (newSlug) {
        // Verify slug uniqueness (excluding own channel)
        const { data: slugCheck } = await supabase
          .from("channels")
          .select("id")
          .eq("slug", newSlug)
          .neq("id", channel.id)
          .single();

        if (slugCheck) {
          return NextResponse.json(
            { error: "That slug is already taken" },
            { status: 409 }
          );
        }
        updates.slug = newSlug;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabase
      .from("channels")
      .update(updates)
      .eq("id", channel.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

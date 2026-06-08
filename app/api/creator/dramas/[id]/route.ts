import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({
        id,
        channel_id: "demo-channel-id",
        title: "Demo Drama",
        logline: "A demo drama for the platform.",
        genre: "Drama",
        poster_gradient: "from-gray-900 to-black",
        poster_url: null,
        total_episodes: 4,
        status: "draft",
        created_at: new Date().toISOString(),
        episodes: [],
      });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch drama with episodes
    const { data: drama, error } = await supabase
      .from("dramas")
      .select("*, episodes(*)")
      .eq("id", id)
      .single();

    if (error || !drama) {
      return NextResponse.json({ error: "Drama not found" }, { status: 404 });
    }

    // Verify ownership through channel
    const { data: channel } = await supabase
      .from("channels")
      .select("id")
      .eq("id", drama.channel_id)
      .eq("owner_id", user.id)
      .single();

    if (!channel) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Sort episodes by episode_number
    if (drama.episodes) {
      drama.episodes.sort(
        (a: { episode_number: number }, b: { episode_number: number }) =>
          a.episode_number - b.episode_number
      );
    }

    return NextResponse.json(drama);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({
        id,
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

    // Fetch drama to verify ownership
    const { data: drama } = await supabase
      .from("dramas")
      .select("channel_id")
      .eq("id", id)
      .single();

    if (!drama) {
      return NextResponse.json({ error: "Drama not found" }, { status: 404 });
    }

    const { data: channel } = await supabase
      .from("channels")
      .select("id")
      .eq("id", drama.channel_id)
      .eq("owner_id", user.id)
      .single();

    if (!channel) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, string | number | null> = {};

    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.logline === "string") updates.logline = body.logline.trim();
    if (typeof body.genre === "string") updates.genre = body.genre.trim();
    if (typeof body.poster_gradient === "string")
      updates.poster_gradient = body.poster_gradient.trim();
    if (typeof body.poster_url === "string")
      updates.poster_url = body.poster_url.trim();
    if (typeof body.total_episodes === "number")
      updates.total_episodes = body.total_episodes;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabase
      .from("dramas")
      .update(updates)
      .eq("id", id)
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({
        deleted: true,
        id,
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

    // Fetch drama to verify ownership
    const { data: drama } = await supabase
      .from("dramas")
      .select("channel_id")
      .eq("id", id)
      .single();

    if (!drama) {
      return NextResponse.json({ error: "Drama not found" }, { status: 404 });
    }

    const { data: channel } = await supabase
      .from("channels")
      .select("id")
      .eq("id", drama.channel_id)
      .eq("owner_id", user.id)
      .single();

    if (!channel) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("dramas").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

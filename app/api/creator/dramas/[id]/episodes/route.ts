import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Verify the current user owns the drama via channel ownership. Returns the channel id or an error response. */
async function verifyDramaOwnership(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  userId: string,
  dramaId: string
): Promise<{ channelId: string } | { error: NextResponse }> {
  const { data: drama } = await supabase
    .from("dramas")
    .select("channel_id")
    .eq("id", dramaId)
    .single();

  if (!drama) {
    return {
      error: NextResponse.json({ error: "Drama not found" }, { status: 404 }),
    };
  }

  const { data: channel } = await supabase
    .from("channels")
    .select("id")
    .eq("id", drama.channel_id)
    .eq("owner_id", userId)
    .single();

  if (!channel) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { channelId: channel.id };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dramaId } = await params;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json([]);
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownership = await verifyDramaOwnership(supabase, user.id, dramaId);
    if ("error" in ownership) return ownership.error;

    const { data: episodes, error } = await supabase
      .from("episodes")
      .select("*")
      .eq("drama_id", dramaId)
      .order("episode_number", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(episodes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dramaId } = await params;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({
        id: "demo-episode-id",
        drama_id: dramaId,
        episode_number: 1,
        title: "Demo Episode",
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

    const ownership = await verifyDramaOwnership(supabase, user.id, dramaId);
    if ("error" in ownership) return ownership.error;

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!title) {
      return NextResponse.json(
        { error: "Episode title is required" },
        { status: 400 }
      );
    }

    // Auto-assign episode_number if not provided
    let episodeNumber: number;
    if (typeof body.episode_number === "number") {
      episodeNumber = body.episode_number;
    } else {
      const { data: existing } = await supabase
        .from("episodes")
        .select("episode_number")
        .eq("drama_id", dramaId)
        .order("episode_number", { ascending: false })
        .limit(1);

      episodeNumber =
        existing && existing.length > 0 ? existing[0].episode_number + 1 : 1;
    }

    const { data: episode, error } = await supabase
      .from("episodes")
      .insert({
        drama_id: dramaId,
        episode_number: episodeNumber,
        title,
        synopsis:
          typeof body.synopsis === "string" ? body.synopsis.trim() : null,
        video_url:
          typeof body.video_url === "string" ? body.video_url.trim() : null,
        poster_url:
          typeof body.poster_url === "string" ? body.poster_url.trim() : null,
        duration_sec:
          typeof body.duration_sec === "number" ? body.duration_sec : null,
        locked: typeof body.locked === "boolean" ? body.locked : false,
        price_cents:
          typeof body.price_cents === "number" ? body.price_cents : 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: `Episode number ${episodeNumber} already exists for this drama` },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(episode, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

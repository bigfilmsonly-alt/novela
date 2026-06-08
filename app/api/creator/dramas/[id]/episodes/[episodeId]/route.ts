import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ id: string; episodeId: string }> };

/** Verify the current user owns the drama (and thus the episode) via channel ownership. */
async function verifyEpisodeOwnership(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  userId: string,
  dramaId: string,
  episodeId: string
): Promise<{ ok: true } | { error: NextResponse }> {
  // Confirm episode belongs to the drama
  const { data: episode } = await supabase
    .from("episodes")
    .select("id, drama_id")
    .eq("id", episodeId)
    .eq("drama_id", dramaId)
    .single();

  if (!episode) {
    return {
      error: NextResponse.json(
        { error: "Episode not found" },
        { status: 404 }
      ),
    };
  }

  // Confirm drama belongs to user's channel
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

  return { ok: true };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dramaId, episodeId } = await params;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({
        id: episodeId,
        drama_id: dramaId,
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

    const ownership = await verifyEpisodeOwnership(
      supabase,
      user.id,
      dramaId,
      episodeId
    );
    if ("error" in ownership) return ownership.error;

    const body = await request.json();
    const updates: Record<string, string | number | boolean | null> = {};

    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.synopsis === "string")
      updates.synopsis = body.synopsis.trim();
    if (typeof body.video_url === "string")
      updates.video_url = body.video_url.trim();
    if (typeof body.poster_url === "string")
      updates.poster_url = body.poster_url.trim();
    if (typeof body.duration_sec === "number")
      updates.duration_sec = body.duration_sec;
    if (typeof body.locked === "boolean") updates.locked = body.locked;
    if (typeof body.price_cents === "number")
      updates.price_cents = body.price_cents;
    if (typeof body.episode_number === "number")
      updates.episode_number = body.episode_number;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabase
      .from("episodes")
      .update(updates)
      .eq("id", episodeId)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "That episode number already exists for this drama" },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dramaId, episodeId } = await params;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({
        deleted: true,
        id: episodeId,
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

    const ownership = await verifyEpisodeOwnership(
      supabase,
      user.id,
      dramaId,
      episodeId
    );
    if ("error" in ownership) return ownership.error;

    const { error } = await supabase
      .from("episodes")
      .delete()
      .eq("id", episodeId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ deleted: true, id: episodeId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

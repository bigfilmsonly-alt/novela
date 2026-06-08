import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ id: string }> };

/** Verify the current user owns the drama via channel ownership. */
async function verifyDramaOwnership(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  userId: string,
  dramaId: string
): Promise<
  { channelId: string; currentStatus: string } | { error: NextResponse }
> {
  const { data: drama } = await supabase
    .from("dramas")
    .select("channel_id, status")
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

  return { channelId: channel.id, currentStatus: drama.status };
}

/** POST — Publish a drama (set status to "published") */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dramaId } = await params;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({
        id: dramaId,
        status: "published",
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

    if (ownership.currentStatus === "published") {
      return NextResponse.json(
        { error: "Drama is already published" },
        { status: 400 }
      );
    }

    // Check that the drama has at least one episode before publishing
    const { count } = await supabase
      .from("episodes")
      .select("*", { count: "exact", head: true })
      .eq("drama_id", dramaId);

    if (!count || count === 0) {
      return NextResponse.json(
        { error: "Cannot publish a drama with no episodes" },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabase
      .from("dramas")
      .update({ status: "published" })
      .eq("id", dramaId)
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

/** DELETE — Unpublish/archive a drama (set status to "archived") */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: dramaId } = await params;
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({
        id: dramaId,
        status: "archived",
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

    if (ownership.currentStatus === "archived") {
      return NextResponse.json(
        { error: "Drama is already archived" },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabase
      .from("dramas")
      .update({ status: "archived" })
      .eq("id", dramaId)
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

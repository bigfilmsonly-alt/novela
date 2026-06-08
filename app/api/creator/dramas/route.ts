import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Drama } from "@/lib/types";

const DEMO_DRAMAS: Drama[] = [
  {
    id: "demo-drama-1",
    channel_id: "demo-channel-id",
    title: "The Inheritance Game",
    logline:
      "When five estranged siblings receive a cryptic summons to their late father's estate, they discover the inheritance isn't money — it's a deadly puzzle only one can survive.",
    genre: "Psychological Thriller",
    poster_gradient: "from-purple-900 to-black",
    poster_url: null,
    total_episodes: 4,
    status: "published",
    created_at: new Date().toISOString(),
  },
];

export async function GET() {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(DEMO_DRAMAS);
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
        { error: "You do not have a channel. Create one first." },
        { status: 404 }
      );
    }

    const { data: dramas, error } = await supabase
      .from("dramas")
      .select("*")
      .eq("channel_id", channel.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(dramas);
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
        ...DEMO_DRAMAS[0],
        id: "demo-new-drama",
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
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (channelError || !channel) {
      return NextResponse.json(
        { error: "You do not have a channel. Create one first." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const logline = typeof body.logline === "string" ? body.logline.trim() : "";
    const genre = typeof body.genre === "string" ? body.genre.trim() : "";

    if (!title || !logline || !genre) {
      return NextResponse.json(
        { error: "title, logline, and genre are required" },
        { status: 400 }
      );
    }

    const { data: drama, error } = await supabase
      .from("dramas")
      .insert({
        channel_id: channel.id,
        title,
        logline,
        genre,
        poster_gradient:
          typeof body.poster_gradient === "string"
            ? body.poster_gradient.trim()
            : "from-gray-900 to-black",
        poster_url:
          typeof body.poster_url === "string" ? body.poster_url.trim() : null,
        total_episodes:
          typeof body.total_episodes === "number" ? body.total_episodes : 4,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(drama, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

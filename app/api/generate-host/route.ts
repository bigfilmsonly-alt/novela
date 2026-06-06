import { NextResponse, type NextRequest } from "next/server";
import { getAnthropic, MODEL } from "@/lib/anthropic";
import type { HostSegment } from "@/lib/types";

const FALLBACK: HostSegment = {
  greeting:
    "Welcome back to Versa TV. I'm your AI host, and tonight we have a stacked lineup.",
  recap:
    "This week on the platform: 'The Inheritance Game' just crossed 1 million views per episode — the fastest any Versa TV original has hit that mark. Meanwhile, Filmology Labs in Paterson just lit up soundstage 14 for a new thriller shot entirely on the LED volume wall.",
  trending:
    "Trending right now: 'I Think My Wife Wants to Kill Me' is the most-binged series this week. Four episodes, each under two minutes, and viewers are watching each one an average of three times. The platform is averaging 425K views per episode with a 68% completion rate — that's unheard of in short-form.",
  recommendation:
    "If you haven't watched 'Nine Mile' yet, start there. It's a music drama set in Jamaica from the Rohan Marley channel — think legacy, identity, and a studio that holds secrets. The cold opens alone are worth the swipe.",
  signoff:
    "That's your daily brief. 120 million episode views and counting. New episodes drop every evening. I'm your AI host — see you tomorrow night on Versa TV.",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const context = typeof body.context === "string" ? body.context : "";

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(FALLBACK);
    }

    const message = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are the AI host of Versa TV, a vertical micro-drama platform (like E! Entertainment for the AI era). You deliver a daily 90-second show briefing — warm, knowledgeable, slightly dramatic.

${context ? `Viewer context: ${context}` : "This is a new viewer with no watch history yet."}

The platform features:
- AI-produced vertical micro-dramas (60-120 second episodes in 9:16 format)
- 120M+ episode views, 425K avg views/episode, 68% completion rate, 28 min daily watch time
- Versa TV Originals: "The Inheritance Game", "I Think My Wife Wants to Kill Me", "The Winter Veil", "The Dumb Billionaire", "Heiress In Love"
- Celebrity-hosted channels (Rohan Marley, Lennox Lewis, Evolve Longevity)
- A Studio where users can create their own series with AI
- Filmology Labs: $250M production facility in Paterson, NJ — 21 soundstages, LED volume wall, 250,000 sq ft
- The vertical micro-drama market is $6.5 billion globally

Return ONLY valid JSON:
{
  "greeting": "Opening line (1 sentence, warm + energetic)",
  "recap": "What happened this week on the platform (2-3 sentences)",
  "trending": "What's hot right now (2-3 sentences with specific numbers)",
  "recommendation": "One personalized pick for this viewer (2-3 sentences)",
  "signoff": "Sign-off (1 sentence, leave them wanting more)"
}`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json(FALLBACK);
    }

    const parsed: HostSegment = JSON.parse(jsonMatch[0]);

    if (!parsed.greeting || !parsed.recap) {
      return NextResponse.json(FALLBACK);
    }

    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(FALLBACK);
  }
}

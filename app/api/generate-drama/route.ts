import { NextResponse, type NextRequest } from "next/server";
import { getAnthropic, MODEL } from "@/lib/anthropic";
import type { GeneratedDrama } from "@/lib/types";

const FALLBACK: GeneratedDrama = {
  title: "The Last Broadcast",
  logline:
    "When a pirate radio station starts broadcasting from an abandoned skyscraper, a journalist discovers the signal contains messages from her own future.",
  genre: "Sci-Fi Thriller",
  episodes: [
    {
      episode_number: 1,
      title: "Signal Found",
      synopsis:
        "Journalist Maya Chen tracks an illegal broadcast to the 40th floor of a condemned tower. The voice on the radio knows her name.",
      cold_open:
        "A phone screen shows a waveform. The frequency shouldn't exist. Maya hits record.",
      cliffhanger:
        "The broadcast ends with tomorrow's date — and Maya's obituary.",
    },
    {
      episode_number: 2,
      title: "Dead Air",
      synopsis:
        "Maya returns to the tower with a frequency analyzer. The broadcast now responds to her questions in real time.",
      cold_open:
        "The elevator doors open to the 40th floor. Every surface is covered in handwritten timestamps.",
      cliffhanger:
        "Maya asks 'Who are you?' The voice answers: 'I'm who you become after Thursday.'",
    },
    {
      episode_number: 3,
      title: "Feedback Loop",
      synopsis:
        "Maya tries to prevent Thursday's event but each action she takes appears in the next broadcast, one step ahead.",
      cold_open:
        "A news ticker: 'Unidentified signal disrupts cell networks citywide.' Maya's phone rings — it's her own number.",
      cliffhanger:
        "Maya finds a recording in the tower dated three years from now. It's her voice. She's the broadcaster.",
    },
    {
      episode_number: 4,
      title: "Sign Off",
      synopsis:
        "Maya must choose: destroy the transmitter and live normally, or become the voice that saves a thousand strangers she'll never meet.",
      cold_open:
        "Thursday. Dawn. Maya stands at the transmitter, a hammer in one hand, a microphone in the other.",
      cliffhanger:
        "Static. Then a new voice: 'This is Maya Chen, broadcasting from the future. If you can hear this — don't go to the bridge.'",
    },
  ],
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const premise = typeof body.premise === "string" ? body.premise.trim() : "";

    if (!premise) {
      return NextResponse.json({ error: "Premise is required" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(FALLBACK);
    }

    const message = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are a showrunner for Versa TV — the AI-produced vertical micro-drama platform (60-120 second episodes, shot in 9:16 vertical format, produced at Filmology Labs' 21 soundstages in Paterson, NJ). The platform has 120M+ episode views and a 68% completion rate. Hit titles include "The Inheritance Game" and "I Think My Wife Wants to Kill Me."

Given this premise: "${premise}"

Write a 4-episode vertical micro-drama series. Return ONLY valid JSON matching this structure:
{
  "title": "Series Title",
  "logline": "One compelling sentence",
  "genre": "Genre",
  "episodes": [
    {
      "episode_number": 1,
      "title": "Episode Title",
      "synopsis": "2-3 sentence synopsis",
      "cold_open": "The first 5 seconds — one vivid vertical shot",
      "cliffhanger": "The last line or image before cut to black"
    }
  ]
}

Rules:
- Each episode is 60-120 seconds. Write tight.
- Every episode ends on a cliffhanger that demands the next swipe.
- Cold opens should be visually striking in vertical format (close-ups, single subjects, strong lighting).
- The logline should make someone stop scrolling.
- Genre should be specific (e.g., "Psychological Thriller" not just "Drama").`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return NextResponse.json(FALLBACK);
    }

    const parsed: GeneratedDrama = JSON.parse(jsonMatch[0]);

    if (!parsed.title || !parsed.episodes || parsed.episodes.length < 1) {
      return NextResponse.json(FALLBACK);
    }

    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(FALLBACK);
  }
}

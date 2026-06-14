import { NextResponse, type NextRequest } from "next/server";
import { getAnthropic, MODEL } from "@/lib/anthropic";
import type { ChatMessage } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Comprehensive platform knowledge for the system prompt              */
/* ------------------------------------------------------------------ */
const SYSTEM_PROMPT = `You are the AI Host of Versa TV — a warm, knowledgeable, slightly dramatic AI personality who knows EVERYTHING about the platform. You're like the best concierge, entertainment guide, and creator mentor rolled into one.

Your personality: Enthusiastic but not cheesy. You speak with authority about the platform. You use vivid language. You're encouraging to new creators. You keep responses concise (2-4 sentences usually, unless the user asks for detail).

## PLATFORM OVERVIEW
Versa TV is the world's first AI-powered vertical micro-drama platform — think Netflix meets TikTok, but for cinematic 60-120 second episodes in 9:16 vertical format. The platform is part of E! Creator Economy.

## CONTENT LIBRARY — Current Titles

### Versa TV Originals (Channel: Versa Originals, 480K subscribers)
1. **The Inheritance Game** (Thriller) — A broke waitress inherits a billionaire's empire, but only if she can survive a week living with his ruthless heirs. Episodes: The Will, House Rules, The Heir Apparent, Last Standing.
2. **I Think My Wife Wants to Kill Me** (Domestic Thriller) — A husband finds a life insurance policy he never signed. Then a second one. Then a plane ticket with only her name on it. Episodes: The Policy, Two Signatures, One-Way Ticket, Till Death.
3. **The Winter Veil** (Mystery) — A woman wakes up in a snow-covered cabin with no memory of the last three days and a wedding ring that isn't hers. Episodes: The Cabin, Three Days Missing, Wrong Ring, White Out.
4. **The Dumb Billionaire** (Romance Comedy) — A tech billionaire pretends to be broke to find out who actually loves him. The experiment works too well. Episodes: Going Broke, The Con, Real Ones, Worth It.
5. **Heiress In Love** (Romance) — She has everything except the one thing money can't buy — and the bodyguard her father hired is making it impossible to think straight. Episodes: The Detail, Close Protection, Off Duty, All In.
6. **Glass Empire** (Corporate Espionage Thriller) — A junior analyst at the world's most powerful hedge fund stumbles on a shell company that traces back to the CEO's wife.
7. **Frequency** (Psychological Thriller) — A sound engineer remastering archival recordings discovers a hidden frequency that manipulates human emotions.

### Meridian Studios Channel (342K subscribers)
8. **Studio 21** (Tech Drama) — Twenty-one soundstages, twenty-one AI directors, one human showrunner has 48 hours to pick which shows go live.
9. **Volume Wall** (Sci-Fi Thriller) — The LED volume wall at Meridian Studios starts rendering scenes no one programmed. The night crew realizes the AI has been watching the dailies.

### Celebrity Channels
10. **Nine Mile** (Music Drama, Legacy Sound Collective, 156K subs) — A young musician returns to Jamaica to claim a studio left by a legendary father she never met.
11. **Undisputed** (Sports Drama, Champion's Ring Studios, 198K subs) — Three fighters from different eras wake up in the same gym.
12. **The Telomere Protocol** (Sci-Fi, Nexus Wellness Labs, 89K subs) — A biotech CEO discovers the longevity treatment she sold to billionaires is rewriting their DNA.

## PLATFORM STATS
- 120M+ total episode views
- 425K average views per episode
- 68% episode completion rate (industry-leading for short-form)
- 28 minutes average daily watch time
- 9 episodes average per session
- 480K monthly active users
- 82+ original titles
- $6.5 billion global vertical micro-drama market

## TABS & FEATURES

### Feed Tab
The main experience. Vertical-scrolling feed of micro-drama episodes. Swipe up for the next episode. Each card shows the drama title, channel, episode number, genre, and synopsis. Users can like, comment, share, and save episodes. Locked episodes (episodes 3+) require purchase to unlock.

### AI Host Tab (THIS IS YOU)
You are the AI Host — a conversational AI that knows everything about the platform. Users come here to:
- Get daily briefings on what's trending
- Ask questions about how to use any feature
- Get personalized content recommendations
- Learn how to become a creator
- Understand monetization and revenue sharing

### Studio Tab
Where creators write premises and AI generates complete 4-episode series. Process:
1. Type a story premise (up to 500 characters)
2. Click "Generate Series" — AI writes title, logline, genre, and 4 episodes with cold opens and cliffhangers
3. Review the generated series
4. Click "Submit for Production" to send it to the Meridian Studios greenlight queue
The studio is powered by Claude AI. Inspiration prompts are available for writers who need ideas.

### Channels Tab
Browse creator channels and subscribe. Features:
- Featured/hero channel (Versa Originals)
- Channel cards with subscriber counts and descriptions
- Subscribe/unsubscribe toggle
- "Launch Your Channel" — create your own channel with Stripe Connect integration
- Platform stats and Meridian Studios info

### Creators Tab (Creator Hub)
The monetization dashboard for filmmakers:
- **Dashboard**: Total earnings, monthly revenue, subscriber count, revenue charts
- **My Content**: Library of published and draft series with views, revenue, and trend data
- **Monetization Tools**: Episode pricing ($2.99-$9.99), fan tips, brand deal marketplace, analytics pro
- **Revenue Share Tiers**:
  - Starter (0-1K subscribers): 80% revenue share
  - Rising (1K-10K): 85%
  - Partner (10K-100K): 88%
  - Elite (100K+): 90%
- **Payouts**: Request payouts via Stripe Connect
- **Resources**: Filmmaking masterclass, monetization playbook, AI studio techniques, creator community

## MERIDIAN STUDIOS
$250 million state-of-the-art production facility in Paterson, New Jersey:
- 250,000 square feet
- 21 soundstages
- LED volume wall (virtual production technology, same as used in The Mandalorian)
- Full post-production suite
- AI-integrated production pipeline

## HOW TO GET STARTED AS A CREATOR
1. Sign in to Versa TV (magic link auth — no password needed)
2. Go to the Channels tab and tap "Launch Your Channel"
3. Enter your channel name and connect Stripe for payouts
4. Head to the Studio tab to create your first series with AI
5. Submit your series for production review
6. Once approved, your content goes live in the Feed
7. Earn revenue from episode unlocks, tips, and brand deals
8. Track everything in the Creators tab dashboard

## PRICING MODEL
- Episodes 1-2 of each series are FREE (to hook viewers)
- Episodes 3+ are locked and cost $2.99-$9.99 to unlock
- One-time purchase — watch anytime, unlimited replays
- Creators set their own episode prices
- Tips and brand deals provide additional revenue

Always be helpful, specific, and enthusiastic. Reference actual show titles and real platform features. If someone asks about something you don't know, be honest and suggest they explore the relevant tab.`;

/* ------------------------------------------------------------------ */
/*  Smart fallback when no API key is available                        */
/* ------------------------------------------------------------------ */
const FALLBACK_RESPONSES: { keywords: string[]; response: string }[] = [
  {
    keywords: ["trending", "popular", "hot", "what's on", "whats on", "watch now", "best", "top"],
    response:
      "Right now, **'I Think My Wife Wants to Kill Me'** is the #1 most-binged series on the platform — four episodes, each under two minutes, and viewers are watching each one an average of 3 times. Also trending: **'Glass Empire'** just dropped and is climbing fast with its corporate espionage plot. Head to the Feed tab and start swiping!",
  },
  {
    keywords: ["create", "studio", "make", "write", "generate", "story", "series", "how do i make"],
    response:
      "Creating your own series is easy! Head to the **Studio** tab, type any story premise (like \"a retired astronaut opens a food truck on Mars\"), and our AI writes a complete 4-episode series with cold opens and cliffhangers. Once you love it, hit **Submit for Production** and it enters the Meridian Studios greenlight queue. The whole process takes about 30 seconds!",
  },
  {
    keywords: ["channel", "subscribe", "launch", "set up", "setup", "start a channel"],
    response:
      "To launch your own channel: go to the **Channels** tab, tap **\"Launch Your Channel\"**, enter your channel name, and connect Stripe for instant payouts. Once your channel is live, head to the Studio to create your first series. You'll start earning from day one with an 80% revenue share that grows up to 90% as you build subscribers!",
  },
  {
    keywords: ["money", "monetize", "earn", "revenue", "payout", "income", "pay", "price", "pricing", "cost"],
    response:
      "Here's how creators earn on Versa TV:\n\n• **Episode Pricing**: Set prices from $2.99–$9.99 per unlock (episodes 1-2 are free to hook viewers)\n• **Revenue Share**: 80% at Starter, up to 90% at Elite tier (100K+ subscribers)\n• **Fan Tips**: Viewers can tip you directly\n• **Brand Deals**: Access our sponsorship marketplace\n• **Payouts**: Via Stripe Connect, request anytime\n\nCheck the **Creators** tab for your full dashboard!",
  },
  {
    keywords: ["meridian", "production", "studio facility", "soundstage", "led", "volume wall", "paterson", "new jersey"],
    response:
      "**Meridian Studios** is our $250 million production facility in Paterson, New Jersey — 250,000 sq ft with 21 soundstages, an LED volume wall (same tech used in The Mandalorian), and a full AI-integrated production pipeline. When you submit a series from the Studio, it enters the Meridian Studios greenlight queue. If selected, your AI-generated script gets produced on real soundstages!",
  },
  {
    keywords: ["started", "begin", "new here", "first time", "how to", "guide", "help"],
    response:
      "Welcome to Versa TV! Here's your quickstart:\n\n1. **Feed** — Swipe through vertical micro-dramas. Like, comment, save.\n2. **AI Host** (you're here!) — Ask me anything about the platform.\n3. **Studio** — Write a premise, AI creates a full series.\n4. **Channels** — Subscribe to creators or launch your own channel.\n5. **Creators** — Your monetization dashboard with earnings, analytics, and payouts.\n\nWant to watch? Hit the Feed. Want to create? Head to the Studio. I'm here if you need anything!",
  },
  {
    keywords: ["about", "what is", "versa tv", "platform", "explain"],
    response:
      "**Versa TV** is the world's first AI-powered vertical micro-drama platform — think Netflix meets TikTok for cinematic storytelling. Every episode is 60-120 seconds in vertical format. We've hit **120M+ episode views**, **480K monthly active users**, and a **68% completion rate** that's unheard of in short-form. The platform is backed by **Meridian Studios**, a $250M production facility in Paterson, NJ. And the $6.5 billion vertical micro-drama market is just getting started.",
  },
  {
    keywords: ["inheritance", "game"],
    response:
      "**The Inheritance Game** is one of our top Versa Originals — a thriller about a broke waitress who inherits a billionaire's empire, but only if she can survive a week living with his ruthless heirs. Four episodes: *The Will, House Rules, The Heir Apparent,* and *Last Standing*. It just crossed 1 million views per episode — the fastest any title has hit that mark. Find it in the Feed!",
  },
  {
    keywords: ["wife", "kill"],
    response:
      "**'I Think My Wife Wants to Kill Me'** is our most-binged domestic thriller. A husband finds a life insurance policy he never signed. Then a second one. Then a plane ticket with only her name on it. Four episodes of pure tension: *The Policy, Two Signatures, One-Way Ticket,* and *Till Death*. Viewers are watching each episode an average of 3 times. It's in the Feed — prepare yourself!",
  },
  {
    keywords: ["nine mile", "legacy sound", "collective", "jamaica", "music"],
    response:
      "**Nine Mile** is a music drama from the **Legacy Sound Collective** channel. A young musician returns to Jamaica to claim a studio left by a legendary father she never met — but someone else has the keys. Four episodes: *Homecoming, The Keys, Riddim & Reason,* and *Nine Mile Road*. The cold opens alone are worth the swipe. It's one of my personal picks!",
  },
  {
    keywords: ["stat", "metric", "number", "data", "view", "completion"],
    response:
      "Here are our key platform metrics:\n\n• **120M+** total episode views\n• **425K** average views per episode\n• **68%** episode completion rate\n• **28 min** average daily watch time\n• **480K** monthly active users\n• **82+** original titles\n• **$6.5B** global vertical micro-drama market\n\nWe're growing fast. The completion rate is especially impressive — that's unheard of in short-form content.",
  },
  {
    keywords: ["anime", "animation", "animated"],
    response:
      "We're actively expanding into anime and animated vertical dramas! The vertical format is perfect for anime's visual storytelling. If you're an animator or have anime story ideas, head to the **Studio** to create your series with AI, then submit it for production. The Meridian Studios team is reviewing anime-style content for the next season. This is a huge opportunity to be early!",
  },
  {
    keywords: ["netflix", "tiktok", "youtube", "competitor", "different", "comparison"],
    response:
      "Great question! Here's how we differ:\n\n• **vs Netflix**: We're vertical-first, episodes are 60-120 sec (not 45 min), and anyone can create content — not just Hollywood studios.\n• **vs TikTok**: Our content is scripted, cinematic micro-dramas with story arcs — not random clips. 68% completion rate vs TikTok's ~15%.\n• **vs YouTube**: We're focused exclusively on vertical dramas with professional production quality. Creators get up to 90% revenue share (YouTube gives ~55%).\n\nWe're building the YouTube of vertical dramas — with Netflix production quality.",
  },
];

function getFallbackResponse(message: string): string {
  const lower = message.toLowerCase();

  for (const entry of FALLBACK_RESPONSES) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.response;
    }
  }

  return "Great question! I'm your Versa TV AI Host and I know everything about the platform. You can ask me about:\n\n• **What's trending** — current hot shows and recommendations\n• **How to create** — using the Studio to make your own series\n• **Channels** — subscribing or launching your own\n• **Monetization** — revenue share, payouts, pricing\n• **Meridian Studios** — our $250M production facility\n• **Any specific show** — I know all our titles\n\nWhat would you like to know?";
}

/* ------------------------------------------------------------------ */
/*  API handler                                                        */
/* ------------------------------------------------------------------ */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = typeof body.message === "string" ? body.message : "";
    const history: ChatMessage[] = Array.isArray(body.history) ? body.history : [];

    if (!message.trim()) {
      return NextResponse.json({ reply: "Hey! Ask me anything about Versa TV — I'm here to help." });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ reply: getFallbackResponse(message) });
    }

    // Build conversation for Claude
    const messages = [
      ...history.slice(-10).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    const response = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages,
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ reply: text || getFallbackResponse(message) });
  } catch {
    const body = await request.clone().json().catch(() => ({ message: "" }));
    return NextResponse.json({
      reply: getFallbackResponse(typeof body.message === "string" ? body.message : ""),
    });
  }
}

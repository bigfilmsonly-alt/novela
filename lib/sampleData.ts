import type { Drama, Episode, Channel } from "./types";

export const SAMPLE_CHANNELS: Channel[] = [
  {
    id: "ch-1",
    owner_id: "user-1",
    name: "Versa Originals",
    slug: "versa-originals",
    description:
      "Premium AI-produced vertical micro-dramas. 80+ originals. 120M+ episode views.",
    avatar_url:
      "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=200&h=200&fit=crop",
    stripe_account_id: null,
    subscriber_count: 480000,
    is_verified: true,
    created_at: "2025-12-01T00:00:00Z",
  },
  {
    id: "ch-2",
    owner_id: "user-2",
    name: "Filmology Labs",
    slug: "filmology-labs",
    description:
      "21 soundstages. LED volume wall. 250,000 sq ft. Paterson, NJ.",
    avatar_url:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=200&h=200&fit=crop",
    stripe_account_id: null,
    subscriber_count: 342000,
    is_verified: true,
    created_at: "2026-02-17T00:00:00Z",
  },
  {
    id: "ch-3",
    owner_id: "user-3",
    name: "Rohan Marley Presents",
    slug: "rohan-marley",
    description: "Culture, legacy, and the next generation",
    avatar_url:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop",
    stripe_account_id: null,
    subscriber_count: 156000,
    is_verified: true,
    created_at: "2025-02-01T00:00:00Z",
  },
  {
    id: "ch-4",
    owner_id: "user-4",
    name: "Lennox Lewis Chronicles",
    slug: "lennox-lewis",
    description: "Champion stories told in vertical format",
    avatar_url:
      "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=200&h=200&fit=crop",
    stripe_account_id: null,
    subscriber_count: 198000,
    is_verified: true,
    created_at: "2025-02-10T00:00:00Z",
  },
  {
    id: "ch-5",
    owner_id: "user-5",
    name: "Evolve Longevity",
    slug: "evolve-longevity",
    description: "Science-backed wellness micro-dramas from Miami",
    avatar_url:
      "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=200&h=200&fit=crop",
    stripe_account_id: null,
    subscriber_count: 89000,
    is_verified: true,
    created_at: "2025-03-01T00:00:00Z",
  },
];

// Versa Originals + Filmology Labs + celebrity channel titles
export const SAMPLE_DRAMAS: Drama[] = [
  // --- Versa Originals ---
  {
    id: "d-1",
    channel_id: "ch-1",
    title: "The Inheritance Game",
    logline:
      "A broke waitress inherits a billionaire's empire — but only if she can survive a week living with his ruthless heirs.",
    genre: "Thriller",
    poster_gradient: "from-red-900 via-black to-purple-900",
    poster_url:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=1400&fit=crop&q=90",
    total_episodes: 4,
    status: "published",
    created_at: "2025-12-01T00:00:00Z",
    channel: SAMPLE_CHANNELS[0],
  },
  {
    id: "d-2",
    channel_id: "ch-1",
    title: "I Think My Wife Wants to Kill Me",
    logline:
      "A husband finds a life insurance policy he never signed. Then a second one. Then a plane ticket with only her name on it.",
    genre: "Domestic Thriller",
    poster_gradient: "from-rose-950 via-stone-900 to-black",
    poster_url:
      "https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=800&h=1400&fit=crop&q=90",
    total_episodes: 4,
    status: "published",
    created_at: "2025-12-01T00:00:00Z",
    channel: SAMPLE_CHANNELS[0],
  },
  {
    id: "d-3",
    channel_id: "ch-1",
    title: "The Winter Veil",
    logline:
      "A woman wakes up in a snow-covered cabin with no memory of the last three days — and a wedding ring that isn't hers.",
    genre: "Mystery",
    poster_gradient: "from-slate-800 via-blue-900 to-black",
    poster_url:
      "https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=800&h=1400&fit=crop&q=90",
    total_episodes: 4,
    status: "published",
    created_at: "2025-12-01T00:00:00Z",
    channel: SAMPLE_CHANNELS[0],
  },
  {
    id: "d-4",
    channel_id: "ch-1",
    title: "The Dumb Billionaire",
    logline:
      "A tech billionaire pretends to be broke to find out who actually loves him. The experiment works too well.",
    genre: "Romance Comedy",
    poster_gradient: "from-amber-900 via-yellow-800 to-black",
    poster_url:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&h=1400&fit=crop&q=90",
    total_episodes: 4,
    status: "published",
    created_at: "2025-12-01T00:00:00Z",
    channel: SAMPLE_CHANNELS[0],
  },
  {
    id: "d-5",
    channel_id: "ch-1",
    title: "Heiress In Love",
    logline:
      "She has everything except the one thing money can't buy — and the bodyguard her father hired is making it impossible to think straight.",
    genre: "Romance",
    poster_gradient: "from-pink-900 via-fuchsia-900 to-black",
    poster_url:
      "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&h=1400&fit=crop&q=90",
    total_episodes: 4,
    status: "published",
    created_at: "2025-12-01T00:00:00Z",
    channel: SAMPLE_CHANNELS[0],
  },
  // --- Filmology Labs originals ---
  {
    id: "d-6",
    channel_id: "ch-2",
    title: "Studio 21",
    logline:
      "Twenty-one soundstages. Twenty-one AI directors. One human showrunner has 48 hours to pick which shows go live — or the platform picks for her.",
    genre: "Tech Drama",
    poster_gradient: "from-violet-900 via-pink-900 to-black",
    poster_url:
      "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=1400&fit=crop&q=90",
    total_episodes: 4,
    status: "published",
    created_at: "2026-03-01T00:00:00Z",
    channel: SAMPLE_CHANNELS[1],
  },
  {
    id: "d-7",
    channel_id: "ch-2",
    title: "Volume Wall",
    logline:
      "When the LED volume wall at Filmology Labs starts rendering scenes no one programmed, the night crew realizes the AI has been watching the dailies — and writing its own show.",
    genre: "Sci-Fi Thriller",
    poster_gradient: "from-blue-900 via-cyan-900 to-black",
    poster_url:
      "https://images.unsplash.com/photo-1558618666-fcd25c85f7e7?w=800&h=1400&fit=crop&q=90",
    total_episodes: 4,
    status: "published",
    created_at: "2026-02-20T00:00:00Z",
    channel: SAMPLE_CHANNELS[1],
  },
  // --- Celebrity channel originals ---
  {
    id: "d-8",
    channel_id: "ch-3",
    title: "Nine Mile",
    logline:
      "A young musician returns to Jamaica to claim a studio left by a legendary father she never met — but someone else has the keys.",
    genre: "Music Drama",
    poster_gradient: "from-green-900 via-yellow-800 to-black",
    poster_url:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=1400&fit=crop&q=90",
    total_episodes: 4,
    status: "published",
    created_at: "2026-01-15T00:00:00Z",
    channel: SAMPLE_CHANNELS[2],
  },
  {
    id: "d-9",
    channel_id: "ch-4",
    title: "Undisputed",
    logline:
      "Three fighters from different eras wake up in the same gym. Only one can leave. The catch: they have to train each other first.",
    genre: "Sports Drama",
    poster_gradient: "from-amber-900 via-red-900 to-black",
    poster_url:
      "https://images.unsplash.com/photo-1517438476312-10d79c077509?w=800&h=1400&fit=crop&q=90",
    total_episodes: 4,
    status: "published",
    created_at: "2026-01-10T00:00:00Z",
    channel: SAMPLE_CHANNELS[3],
  },
  {
    id: "d-10",
    channel_id: "ch-5",
    title: "The Telomere Protocol",
    logline:
      "A biotech CEO discovers the longevity treatment she sold to billionaires is rewriting their DNA — and their personalities.",
    genre: "Sci-Fi Thriller",
    poster_gradient: "from-emerald-900 via-teal-900 to-black",
    poster_url:
      "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&h=1400&fit=crop&q=90",
    total_episodes: 4,
    status: "published",
    created_at: "2026-01-05T00:00:00Z",
    channel: SAMPLE_CHANNELS[4],
  },
  // --- New titles ---
  {
    id: "d-11",
    channel_id: "ch-1",
    title: "Glass Empire",
    logline:
      "A junior analyst at the world's most powerful hedge fund stumbles on a shell company that traces back to the CEO's wife — and the deeper she digs, the more she realizes the glass walls are watching.",
    genre: "Corporate Espionage Thriller",
    poster_gradient: "from-sky-900 via-slate-900 to-black",
    poster_url:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=1400&fit=crop&q=90",
    total_episodes: 4,
    status: "published",
    created_at: "2026-04-10T00:00:00Z",
    channel: SAMPLE_CHANNELS[0],
  },
  {
    id: "d-12",
    channel_id: "ch-2",
    title: "Frequency",
    logline:
      "A sound engineer remastering archival recordings discovers a hidden frequency that manipulates human emotions — and someone has been embedding it in hit songs for decades.",
    genre: "Psychological Thriller",
    poster_gradient: "from-indigo-900 via-purple-900 to-black",
    poster_url:
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=1400&fit=crop&q=90",
    total_episodes: 4,
    status: "published",
    created_at: "2026-04-22T00:00:00Z",
    channel: SAMPLE_CHANNELS[1],
  },
];

function makeEpisodes(dramaId: string, drama: Drama): Episode[] {
  const titles: Record<string, string[]> = {
    "d-1": ["The Will", "House Rules", "The Heir Apparent", "Last Standing"],
    "d-2": ["The Policy", "Two Signatures", "One-Way Ticket", "Till Death"],
    "d-3": ["The Cabin", "Three Days Missing", "Wrong Ring", "White Out"],
    "d-4": ["Going Broke", "The Con", "Real Ones", "Worth It"],
    "d-5": ["The Detail", "Close Protection", "Off Duty", "All In"],
    "d-6": ["Day One", "The Pitch", "AI vs. Instinct", "Greenlight"],
    "d-7": ["Boot Sequence", "The Wall Speaks", "Override", "Final Render"],
    "d-8": ["Homecoming", "The Keys", "Riddim & Reason", "Nine Mile Road"],
    "d-9": ["The Gym", "Southpaw Lessons", "Three Rounds", "The Bell"],
    "d-10": ["Trial Phase", "Side Effects", "The Board Meeting", "Rewrite"],
    "d-11": [
      "The Shell Company",
      "Glass Walls",
      "Insider Threat",
      "Hostile Takeover",
    ],
    "d-12": [
      "The Lost Tape",
      "440 Hz",
      "Subliminal",
      "The Broadcast",
    ],
  };

  const viewTiers: Record<string, [number, number]> = {
    "d-1": [850000, 1200000],
    "d-2": [720000, 1100000],
    "d-3": [600000, 950000],
    "d-4": [750000, 1150000],
    "d-5": [680000, 1050000],
    "d-6": [550000, 880000],
    "d-7": [620000, 970000],
    "d-8": [500000, 810000],
    "d-9": [580000, 920000],
    "d-10": [510000, 830000],
    "d-11": [650000, 1000000],
    "d-12": [530000, 860000],
  };

  // Every episode gets a unique video — all 48 verified Mixkit IDs, zero duplicates
  const videoUrls: Record<string, string[]> = {
    "d-1": [
      "https://assets.mixkit.co/videos/44314/44314-720.mp4",   // haunted mansion explore
      "https://assets.mixkit.co/videos/34561/34561-720.mp4",   // dark city road night
      "https://assets.mixkit.co/videos/41185/41185-720.mp4",   // luxury houses on tablet
      "https://assets.mixkit.co/videos/35534/35534-720.mp4",   // flames burning fire
    ],
    "d-2": [
      "https://assets.mixkit.co/videos/3458/3458-720.mp4",     // candle lit in dark
      "https://assets.mixkit.co/videos/44694/44694-720.mp4",    // bokeh city avenue night
      "https://assets.mixkit.co/videos/28085/28085-720.mp4",   // heavy rain open window
      "https://assets.mixkit.co/videos/21144/21144-720.mp4",   // rain hitting window
    ],
    "d-3": [
      "https://assets.mixkit.co/videos/3352/3352-720.mp4",     // snow falling pine forest
      "https://assets.mixkit.co/videos/3308/3308-720.mp4",     // snowy mountain mist
      "https://assets.mixkit.co/videos/47698/47698-720.mp4",   // lightning clouds storm
      "https://assets.mixkit.co/videos/25004/25004-720.mp4",   // night sky lightning
    ],
    "d-4": [
      "https://assets.mixkit.co/videos/22739/22739-720.mp4",   // champagne pour dark bg
      "https://assets.mixkit.co/videos/40652/40652-720.mp4",   // skyscrapers sunset
      "https://assets.mixkit.co/videos/4308/4308-720.mp4",     // aerial city night
      "https://assets.mixkit.co/videos/22850/22850-720.mp4",   // smoking cocktail glass
    ],
    "d-5": [
      "https://assets.mixkit.co/videos/44556/44556-720.mp4",   // stylish woman camaro
      "https://assets.mixkit.co/videos/1232/1232-720.mp4",     // girl neon sign
      "https://assets.mixkit.co/videos/18308/18308-720.mp4",   // heart drawn foggy window
      "https://assets.mixkit.co/videos/20514/20514-720.mp4",   // rain on car window
    ],
    "d-6": [
      "https://assets.mixkit.co/videos/50460/50460-720.mp4",   // cyberpunk glasses neon
      "https://assets.mixkit.co/videos/1238/1238-720.mp4",     // man holding neon
      "https://assets.mixkit.co/videos/46574/46574-720.mp4",   // man typing laptop dark
      "https://assets.mixkit.co/videos/46578/46578-720.mp4",   // hoodie hacker typing
    ],
    "d-7": [
      "https://assets.mixkit.co/videos/42199/42199-720.mp4",   // neon masks dancing dark
      "https://assets.mixkit.co/videos/47088/47088-720.mp4",   // neon disco lights
      "https://assets.mixkit.co/videos/50951/50951-720.mp4",   // smoke trail twirling
      "https://assets.mixkit.co/videos/8461/8461-720.mp4",     // smoke rising dark
    ],
    "d-8": [
      "https://assets.mixkit.co/videos/51500/51500-720.mp4",   // turquoise beach aerial
      "https://assets.mixkit.co/videos/42814/42814-720.mp4",   // drummer in dark
      "https://assets.mixkit.co/videos/44143/44143-720.mp4",   // pianist hands keyboard
      "https://assets.mixkit.co/videos/43776/43776-720.mp4",   // skilled pianist playing
    ],
    "d-9": [
      "https://assets.mixkit.co/videos/40276/40276-720.mp4",   // boxer punching bag
      "https://assets.mixkit.co/videos/40971/40971-720.mp4",   // boxer training ring
      "https://assets.mixkit.co/videos/17724/17724-720.mp4",   // fire flames black bg
      "https://assets.mixkit.co/videos/8388/8388-720.mp4",     // flames burning screen
    ],
    "d-10": [
      "https://assets.mixkit.co/videos/3790/3790-720.mp4",     // lab viruses red
      "https://assets.mixkit.co/videos/40746/40746-720.mp4",   // night city walk
      "https://assets.mixkit.co/videos/8509/8509-720.mp4",     // smoke shapes dark
      "https://assets.mixkit.co/videos/8505/8505-720.mp4",     // smoke drifting room
    ],
    "d-11": [
      "https://assets.mixkit.co/videos/44690/44690-720.mp4",   // aerial busy city night
      "https://assets.mixkit.co/videos/26863/26863-720.mp4",   // aerial empty city night
      "https://assets.mixkit.co/videos/50990/50990-720.mp4",   // timelapse car city night
      "https://assets.mixkit.co/videos/26253/26253-720.mp4",   // driving home night
    ],
    "d-12": [
      "https://assets.mixkit.co/videos/3287/3287-720.mp4",     // hand playing piano
      "https://assets.mixkit.co/videos/4295/4295-720.mp4",     // barmaid cocktail bar
      "https://assets.mixkit.co/videos/2846/2846-720.mp4",     // window rainy day
      "https://assets.mixkit.co/videos/4422/4422-720.mp4",     // thunderstorm night
    ],
  };

  // Every episode gets its own unique poster image
  const episodePosters: Record<string, string[]> = {
    "d-1": [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=1400&fit=crop&q=90",
    ],
    "d-2": [
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1516410529446-2c777cb7366d?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=800&h=1400&fit=crop&q=90",
    ],
    "d-3": [
      "https://images.unsplash.com/photo-1482784160316-6eb046863ece?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1478265409131-1f65c88f965c?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1517299321609-52687d1bc55a?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1457269449834-928af64c684d?w=800&h=1400&fit=crop&q=90",
    ],
    "d-4": [
      "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1470219556762-1fd5b5f14585?w=800&h=1400&fit=crop&q=90",
    ],
    "d-5": [
      "https://images.unsplash.com/photo-1520450202524-87e5ddcc3dbb?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=1400&fit=crop&q=90",
    ],
    "d-6": [
      "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&h=1400&fit=crop&q=90",
    ],
    "d-7": [
      "https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=1400&fit=crop&q=90",
    ],
    "d-8": [
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=1400&fit=crop&q=90",
    ],
    "d-9": [
      "https://images.unsplash.com/photo-1517438984742-1262db08379e?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1517438322307-e67f1cb42bbe?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&h=1400&fit=crop&q=90",
    ],
    "d-10": [
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&h=1400&fit=crop&q=90",
    ],
    "d-11": [
      "https://images.unsplash.com/photo-1464938050520-ef2571e0d6e0?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=1400&fit=crop&q=90",
    ],
    "d-12": [
      "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=1400&fit=crop&q=90",
      "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&h=1400&fit=crop&q=90",
    ],
  };

  const eps =
    titles[dramaId] || ["Episode 1", "Episode 2", "Episode 3", "Episode 4"];

  const [minViews, maxViews] = viewTiers[dramaId] || [500000, 800000];
  const dramaVideos = videoUrls[dramaId] || [];
  const epPosters = episodePosters[dramaId] || [];

  return eps.map((title, i) => ({
    id: `${dramaId}-ep-${i + 1}`,
    drama_id: dramaId,
    episode_number: i + 1,
    title,
    synopsis: `${drama.logline} — Episode ${i + 1}: ${title}.`,
    video_url: dramaVideos[i] || null,
    poster_url: epPosters[i] || drama.poster_url,
    duration_sec: 60 + Math.floor(Math.random() * 60),
    locked: i >= 2,
    price_cents: i >= 2 ? 499 : 0,
    view_count:
      Math.floor(Math.random() * (maxViews - minViews)) + minViews,
    like_count: Math.floor(Math.random() * 80000) + 15000,
    created_at: drama.created_at,
    drama,
  }));
}

export const SAMPLE_EPISODES: Episode[] = SAMPLE_DRAMAS.flatMap((d) =>
  makeEpisodes(d.id, d)
);

// Real platform metrics for the AI Host and stats
export const PLATFORM_STATS = {
  totalEpisodeViews: 120_000_000,
  avgViewsPerEpisode: 425_000,
  topTitleViewsPerEpisode: 1_000_000,
  episodeCompletionRate: 0.68,
  avgDailyWatchMinutes: 28,
  avgEpisodesPerSession: 9,
  monthlyActiveUsers: 480_000,
  dauToMauRatio: 0.3,
  totalOriginalTitles: 82,
  genres: ["Romance", "Thriller", "Comedy", "Drama", "Sci-Fi", "Mystery"],
  episodeDurationRange: "60-120 seconds",
  filmologySquareFt: 250_000,
  filmologySoundstages: 21,
  filmologyInvestment: 250_000_000,
  marketSize: 6_500_000_000,
};

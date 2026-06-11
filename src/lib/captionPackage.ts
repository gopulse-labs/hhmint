export type CaptionVariant = "personal" | "editorial" | "minimal";

export interface CaptionPackageInput {
  headline: string;
  style: string;
  variant?: CaptionVariant;
}

export interface CaptionPackage {
  caption: string;
  hashtags: string[];
  altText: string;
  suggestedFirstComment: string;
  modelUsed?: string;
  usedFallback?: boolean;
}

interface HeadlineTheme {
  id: string;
  sourceTopic: string;
  subject: string;
  tension: string;
  hashtags: string[];
  comments: string[];
  keywords: string[];
}

interface StyleProfile {
  captionName: string;
  hashtag: string;
  defaultFit: string;
  themeFits?: Record<string, string>;
  themeComments?: Record<string, string>;
}

const GENERIC_HASHTAGS = new Set([
  "#AIArt",
  "#DigitalArt",
  "#Art",
  "#Artist",
  "#InstaArt",
  "#GeneratedArt",
]);

const HEADLINE_THEMES: HeadlineTheme[] = [
  {
    id: "iran_brinkmanship",
    sourceTopic: "Iran, military strikes, and diplomatic talks",
    subject: "brinkmanship",
    tension:
      "The headline is basically about brinkmanship: military threat on one side, diplomatic talks on the other, and uncertainty over which one is real.",
    hashtags: ["#PoliticalArt", "#ForeignPolicy", "#Diplomacy", "#VisualJournalism"],
    comments: [
      "This one feels more like a pause than a resolution.",
      "The peaceful part somehow feels less stable than the violent part.",
      "The missiles and the handshake are doing most of the work here.",
    ],
    keywords: ["iran", "tehran", "strike", "strikes", "missile", "missiles", "talks", "diplomacy", "negotiation"],
  },
  {
    id: "climate_weather",
    sourceTopic: "climate, oceans, and extreme weather",
    subject: "weather instability",
    tension:
      "The story is about weather becoming harder to treat as background: oceans, heat, and extreme conditions starting to push into everyday life.",
    hashtags: ["#ClimateArt", "#ClimateCommunication", "#OceanScience", "#VisualJournalism"],
    comments: [
      "The weather feels like the main character here.",
      "This one came out more unstable than I expected.",
      "The chart part almost disappears once the weather starts feeling physical.",
    ],
    keywords: [
      "climate",
      "weather",
      "heat",
      "warming",
      "wildfire",
      "drought",
      "flood",
      "storm",
      "hurricane",
      "ocean",
      "pacific",
      "atlantic",
      "el nino",
      "el niño",
      "circulation",
      "cold blob",
    ],
  },
  {
    id: "space_distance",
    sourceTopic: "space, discovery, and distance",
    subject: "discovery and distance",
    tension:
      "The story is about discovery, but also distance: seeing farther without necessarily feeling closer to what is out there.",
    hashtags: ["#ScienceArt", "#SpaceScience", "#EditorialIllustration", "#VisualJournalism"],
    comments: [
      "This one came out lonelier than I expected.",
      "The telescope almost feels useless in this one.",
      "Not sure why space always ends up feeling this private, but it fits.",
    ],
    keywords: ["space", "nasa", "planet", "jupiter", "mars", "moon", "telescope", "webb", "hubble", "asteroid"],
  },
  {
    id: "ai_speed",
    sourceTopic: "AI, technology, and human judgment",
    subject: "technology moving too quickly",
    tension:
      "The story is about technology moving faster than people can emotionally process, with decisions getting handed to systems nobody fully understands.",
    hashtags: ["#TechCulture", "#TechnologyArt", "#TechPolicy", "#VisualJournalism"],
    comments: [
      "This one feels a little too automated, which is probably right.",
      "I like when the future looks less sleek and more breakable.",
      "The machine part feels less confident than it should.",
    ],
    keywords: ["ai", "artificial intelligence", "algorithm", "openai", "robot", "automation"],
  },
  {
    id: "tech_infrastructure",
    sourceTopic: "technology infrastructure and public life",
    subject: "fragile technology infrastructure",
    tension:
      "The story is about invisible infrastructure suddenly becoming visible: chips, software, networks, and the people depending on them.",
    hashtags: ["#TechCulture", "#TechnologyArt", "#VisualJournalism", "#EditorialIllustration"],
    comments: [
      "I like when the tech starts looking less sleek and more breakable.",
      "The whole thing feels more fragile than the product language usually admits.",
      "The machinery is doing most of the emotional work here.",
    ],
    keywords: ["chip", "semiconductor", "software", "data", "cyber", "internet", "app", "device"],
  },
  {
    id: "court_reversal",
    sourceTopic: "a court ruling and an overturned conviction",
    subject: "legal reversal",
    tension:
      "The story is about a legal reversal: a major conviction being unsettled again, and certainty giving way to another round of doubt.",
    hashtags: ["#CourtroomArt", "#LegalNews", "#EditorialIllustration", "#VisualJournalism"],
    comments: [
      "This one feels like the floor moved a little.",
      "The blank space feels heavier than the verdict here.",
      "The legal part feels colder than I expected.",
    ],
    keywords: ["supreme court", "court", "ruling", "judge", "justice", "conviction", "overturns", "overturned", "murder"],
  },
  {
    id: "race_violence_flashpoint",
    sourceTopic: "violence, race, and public outrage",
    subject: "a public narrative turning into a flashpoint",
    tension:
      "The story is about violence becoming a public argument: race, grief, outrage, and competing versions of what happened.",
    hashtags: ["#SocialCommentary", "#RaceInAmerica", "#EditorialIllustration", "#VisualJournalism"],
    comments: [
      "This one feels tense even before anything happens.",
      "The quiet parts feel louder than the obvious ones here.",
      "I like how unresolved this one feels.",
    ],
    keywords: ["stabbing", "racial", "race", "flashpoint", "karmelo", "anthony", "texas", "outrage"],
  },
  {
    id: "sports_comeback",
    sourceTopic: "basketball, comeback momentum, and public emotion",
    subject: "a comeback turning into release",
    tension:
      "The story is about a comeback becoming bigger than the game itself: exhaustion, momentum, and a crowd suddenly believing again.",
    hashtags: ["#SportsArt", "#BasketballArt", "#SportsCulture", "#EditorialIllustration"],
    comments: [
      "The exhausted guys around the celebration are what make this one work.",
      "This one feels like the second after everyone realizes it actually happened.",
      "The celebration feels heavy in a good way.",
    ],
    keywords: ["knicks", "spurs", "nba", "basketball", "game 4", "comeback", "playoff", "playoffs", "title", "athletic"],
  },
  {
    id: "housing_pressure",
    sourceTopic: "housing pressure and city life",
    subject: "housing pressure",
    tension:
      "The story is about housing pressure becoming personal: rent, policy, money, and the question of who gets to stay.",
    hashtags: ["#Urbanism", "#Housing", "#CityFutures", "#EditorialIllustration"],
    comments: [
      "The buildings feel like they are leaning on each other.",
      "This one feels cramped in the right way.",
      "The housing part feels less abstract when the walls start closing in.",
    ],
    keywords: ["housing", "rent", "zoning", "neighborhood", "tenant", "landlord", "affordable"],
  },
  {
    id: "markets_pressure",
    sourceTopic: "markets, prices, and household pressure",
    subject: "economic pressure",
    tension:
      "The story is about numbers turning into pressure people actually feel: prices, rates, markets, and uncertainty around what comes next.",
    hashtags: ["#EconomicsArt", "#MarketCulture", "#EconomicPolicy", "#EditorialIllustration"],
    comments: [
      "The money-weather thing feels weirdly right to me.",
      "This one feels more stressful than the numbers look on paper.",
      "The cleanest part of the image is somehow the least comforting.",
    ],
    keywords: ["market", "stocks", "inflation", "rates", "fed", "economy", "recession", "tariff", "trade", "bank", "debt", "prices"],
  },
  {
    id: "election_pressure",
    sourceTopic: "elections, campaigning, and public pressure",
    subject: "campaign pressure",
    tension:
      "The story is about politics as pressure: votes, messaging, ambition, and the feeling that every public gesture is being staged.",
    hashtags: ["#PoliticalArt", "#ElectionArt", "#VisualJournalism", "#EditorialIllustration"],
    comments: [
      "The staged part feels like the honest part here.",
      "This one feels more like a pause before the noise starts.",
      "The campaign energy is doing a lot of work here.",
    ],
    keywords: ["election", "vote", "campaign", "president", "congress", "senate", "democrat", "republican", "trump", "biden"],
  },
  {
    id: "war_civilian_risk",
    sourceTopic: "war, civilian risk, and political decision-making",
    subject: "conflict and civilian risk",
    tension:
      "The story is about conflict closing in on ordinary life: weapons, borders, official language, and people caught underneath it.",
    hashtags: ["#WarAndPeace", "#PoliticalArt", "#ForeignPolicy", "#VisualJournalism"],
    comments: [
      "The ordinary-life part getting squeezed is what stuck with me.",
      "This one feels more like a warning than a scene.",
      "The quiet parts make the violent parts feel worse.",
    ],
    keywords: ["war", "military", "attack", "ceasefire", "invasion", "border", "civilian"],
  },
];

const FALLBACK_THEME: HeadlineTheme = {
  id: "general_news",
  sourceTopic: "the story in the headline",
  subject: "the story",
  tension:
    "The story is about a public event becoming hard to read cleanly: facts, framing, and the feeling that something is still unresolved.",
  hashtags: ["#EditorialIllustration", "#VisualJournalism", "#NewsVisuals"],
  comments: [
    "This one came out a little more unresolved than I expected.",
    "The image feels like it is holding something back.",
    "I like that this does not feel fully settled.",
  ],
  keywords: [],
};

const STYLE_PROFILES: Record<string, StyleProfile> = {
  "abstract expressionist": {
    captionName: "abstract-expressionist style",
    hashtag: "#AbstractExpressionism",
    defaultFit:
      "The abstract-expressionist style works because it lets the emotional pressure show before the literal details do.",
    themeFits: {
      race_violence_flashpoint:
        "The abstract-expressionist style works because it can carry anger and panic without turning the story into a neat illustration.",
      markets_pressure:
        "The abstract-expressionist style works because it makes the economic pressure feel messy instead of pretending the numbers are calm.",
    },
  },
  "art deco": {
    captionName: "Art Deco style",
    hashtag: "#ArtDeco",
    defaultFit:
      "The Art Deco style works because its polished order makes the tension feel public, official, and a little theatrical.",
  },
  "art nouveau": {
    captionName: "Art Nouveau style",
    hashtag: "#ArtNouveau",
    defaultFit:
      "The Art Nouveau style works because its ornamental curves can make the story feel beautiful and uneasy at the same time.",
  },
  "bauhaus": {
    captionName: "Bauhaus style",
    hashtag: "#Bauhaus",
    defaultFit:
      "The Bauhaus style works because it turns the story into blocks, systems, and pressure points instead of decoration.",
  },
  "baroque": {
    captionName: "Baroque style",
    hashtag: "#BaroqueArt",
    defaultFit:
      "The Baroque style works because it makes the drama feel oversized, lit from above, and impossible to ignore.",
    themeFits: {
      sports_comeback:
        "The Baroque style works because it treats the comeback like a scene of release, exhaustion, and almost religious drama.",
    },
  },
  "classical": {
    captionName: "classical style",
    hashtag: "#ClassicalArt",
    defaultFit:
      "The classical style works because it gives the story a sense of weight, restraint, and historical consequence.",
  },
  "conceptual": {
    captionName: "conceptual style",
    hashtag: "#ConceptualArt",
    defaultFit:
      "The conceptual style works because it can make the missing pieces feel as important as the visible ones.",
  },
  "constructivist": {
    captionName: "Constructivist style",
    hashtag: "#Constructivism",
    defaultFit:
      "The Constructivist style works because it makes the story feel like public messaging under stress.",
    themeFits: {
      iran_brinkmanship:
        "The Constructivist style works because brinkmanship is partly about public messaging: force, warning, and persuasion all competing for the same poster.",
      election_pressure:
        "The Constructivist style works because campaigns already behave like posters: simple shapes trying to control a messy reality.",
    },
  },
  "contemporary": {
    captionName: "contemporary style",
    hashtag: "#ContemporaryArt",
    defaultFit:
      "The contemporary style works because it can keep the story current, fragmented, and unresolved.",
  },
  "cubist": {
    captionName: "Cubist style",
    hashtag: "#Cubism",
    defaultFit:
      "The Cubist style works because it shows the story from several angles at once without forcing them to agree.",
  },
  "dada": {
    captionName: "Dada style",
    hashtag: "#DadaArt",
    defaultFit:
      "The Dada style works because the story already feels fragmented, contradictory, and slightly absurd.",
    themeFits: {
      iran_brinkmanship:
        "The Dada style works because threats and talks sitting side by side already feel like a collage of contradiction.",
      election_pressure:
        "The Dada style works because political messaging can become absurd fast when every fragment is fighting for attention.",
    },
  },
  "expressionist": {
    captionName: "expressionist style",
    hashtag: "#Expressionism",
    defaultFit:
      "The expressionist style works because it lets fear, anger, and pressure distort the scene instead of smoothing it out.",
    themeFits: {
      race_violence_flashpoint:
        "The expressionist style works because it can make grief, anger, and public panic feel visible without pretending they are tidy.",
    },
  },
  "fauvist": {
    captionName: "Fauvist style",
    hashtag: "#Fauvism",
    defaultFit:
      "The Fauvist style works because the color can make the emotion feel louder than the facts on the surface.",
  },
  "futurist": {
    captionName: "futurist style",
    hashtag: "#Futurism",
    defaultFit:
      "The futurist style works because it makes motion, technology, and the promise of progress feel slightly out of control.",
    themeFits: {
      ai_speed:
        "The futurist style works because it makes the future look fast, old-fashioned, and slightly out of control all at once.",
      space_distance:
        "The futurist style works because space stories still carry old dreams of progress, even when the future feels strange.",
    },
  },
  "graffiti": {
    captionName: "graffiti style",
    hashtag: "#StreetArt",
    defaultFit:
      "The graffiti style works because it makes the story feel public, immediate, and written directly onto the street.",
  },
  "impressionist": {
    captionName: "impressionist style",
    hashtag: "#Impressionism",
    defaultFit:
      "The impressionist style works because it keeps the story soft-edged, like something still forming in real time.",
  },
  "minimalist": {
    captionName: "minimalist style",
    hashtag: "#Minimalism",
    defaultFit:
      "The minimalist style works because it strips the story down until the silence and empty space start doing the work.",
    themeFits: {
      court_reversal:
        "The minimalist style works because legal uncertainty can feel coldest when almost nothing is there.",
      iran_brinkmanship:
        "The minimalist style works because the threat feels sharper when the image leaves room for what has not happened yet.",
    },
  },
  "neoclassical": {
    captionName: "neoclassical style",
    hashtag: "#NeoclassicalArt",
    defaultFit:
      "The neoclassical style works because it turns the story into a formal scene of power, consequence, and public memory.",
    themeFits: {
      sports_comeback:
        "The neoclassical style works because it treats the comeback like a mythic scene without losing the exhaustion underneath it.",
    },
  },
  "pencil drawing": {
    captionName: "pencil-sketch style",
    hashtag: "#Drawing",
    defaultFit:
      "The pencil-sketch style works because it makes the whole thing feel provisional, like a tense draft rather than a settled decision.",
    themeFits: {
      iran_brinkmanship:
        "The pencil-sketch style works because it makes the whole thing feel provisional, like a tense draft of history rather than a settled decision.",
      court_reversal:
        "The pencil-sketch style works because the story feels unresolved, like the record is still being erased and redrawn.",
    },
    themeComments: {
      iran_brinkmanship: "The sketch style makes it feel like the decision is still being erased and redrawn.",
      court_reversal: "The erased-and-redrawn feeling is doing a lot here.",
    },
  },
  "pointillist": {
    captionName: "pointillist style",
    hashtag: "#Pointillism",
    defaultFit:
      "The pointillist style works because the larger picture only appears after a lot of tiny pieces start adding up.",
  },
  "pop art": {
    captionName: "Pop Art style",
    hashtag: "#PopArt",
    defaultFit:
      "The Pop Art style works because it makes the public spectacle feel bright, repeated, and a little too loud.",
  },
  "realist": {
    captionName: "realist style",
    hashtag: "#Realism",
    defaultFit:
      "The realist style works because it keeps the story grounded in plain details instead of letting it drift into myth.",
  },
  "renaissance": {
    captionName: "Renaissance style",
    hashtag: "#RenaissanceArt",
    defaultFit:
      "The Renaissance style works because it gives the story a staged human drama, with every gesture carrying extra weight.",
  },
  "rococo": {
    captionName: "Rococo style",
    hashtag: "#Rococo",
    defaultFit:
      "The Rococo style works because the decorative excess can make the seriousness underneath feel even stranger.",
  },
  "romantic": {
    captionName: "Romantic style",
    hashtag: "#Romanticism",
    defaultFit:
      "The Romantic style works because it turns the story into scale, weather, and emotion instead of a clean report.",
  },
  "surrealist": {
    captionName: "surreal style",
    hashtag: "#SurrealCollage",
    defaultFit:
      "The surreal style works because it turns the pressure into something physical and unstable instead of just another explanation.",
    themeFits: {
      climate_weather:
        "The surreal style works because it turns climate pressure into something physical and unstable instead of just another chart.",
      space_distance:
        "The surreal style works because it makes space feel less like a diagram and more like a private dream.",
      ai_speed:
        "The surreal style works because the technology already feels a little unreal, like the future arrived before anyone was ready.",
    },
  },
  "abstract": {
    captionName: "abstract style",
    hashtag: "#AbstractIllustration",
    defaultFit:
      "The abstract style works because it can hold pressure, motion, and uncertainty without pretending the story is simple.",
  },
  "symbolist": {
    captionName: "symbolist style",
    hashtag: "#Symbolism",
    defaultFit:
      "The symbolist style works because one object can carry more of the story than a literal scene would.",
  },
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeStyleKey(style: string) {
  return normalizeWhitespace(style).toLowerCase();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesKeyword(text: string, keyword: string) {
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(keyword)}([^a-z0-9]|$)`, "i");

  return pattern.test(text);
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => includesKeyword(text, keyword.toLowerCase()));
}

function toHashtag(value: string) {
  const compact = normalizeWhitespace(value)
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  return compact ? `#${compact}` : "#EditorialIllustration";
}

function extractHeadlineSubject(headline: string) {
  const stopWords = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "but",
    "by",
    "for",
    "from",
    "has",
    "have",
    "how",
    "in",
    "into",
    "is",
    "it",
    "its",
    "new",
    "of",
    "on",
    "or",
    "over",
    "says",
    "that",
    "the",
    "this",
    "to",
    "with",
  ]);
  const words = normalizeWhitespace(headline)
    .replace(/[^a-zA-Z0-9' ]/g, " ")
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !stopWords.has(word.toLowerCase()));
  const subject = words.slice(0, 5).join(" ");

  return subject || "the story in the headline";
}

function inferTheme(headline: string): HeadlineTheme {
  const normalized = headline.toLowerCase();
  const directTheme = HEADLINE_THEMES.find((theme) => includesAny(normalized, theme.keywords));

  if (directTheme) return directTheme;

  const subject = extractHeadlineSubject(headline);

  return {
    ...FALLBACK_THEME,
    sourceTopic: subject,
    subject,
    tension: `The story is about ${subject}, and the part that matters is the uncertainty around what it means next.`,
  };
}

function inferStyle(style: string): StyleProfile {
  const styleKey = normalizeStyleKey(style);

  return STYLE_PROFILES[styleKey] || {
    captionName: `${normalizeWhitespace(style) || "editorial"} style`,
    hashtag: toHashtag(style || "Editorial Illustration"),
    defaultFit:
      "The selected style works because it gives the headline a clearer emotional shape without overexplaining it.",
  };
}

function getStyleFit(theme: HeadlineTheme, style: StyleProfile) {
  return style.themeFits?.[theme.id] || style.defaultFit;
}

function getSuggestedFirstComment(theme: HeadlineTheme, style: StyleProfile) {
  return style.themeComments?.[theme.id] || theme.comments[0];
}

function uniqueHashtags(candidates: string[]) {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const candidate of candidates) {
    const normalized = candidate.startsWith("#") ? candidate : `#${candidate}`;
    const key = normalized.toLowerCase();

    if (!GENERIC_HASHTAGS.has(normalized) && !seen.has(key)) {
      seen.add(key);
      tags.push(normalized);
    }
  }

  return tags;
}

function buildHashtags(theme: HeadlineTheme, style: StyleProfile) {
  return uniqueHashtags([
    ...theme.hashtags,
    style.hashtag,
    "#EditorialIllustration",
    "#VisualJournalism",
  ]).slice(0, 7);
}

function buildCaption(theme: HeadlineTheme, style: StyleProfile) {
  return `${theme.tension} ${getStyleFit(theme, style)} Made with HeadlineHarmonies.`;
}

function buildAltText(headline: string, theme: HeadlineTheme, style: StyleProfile) {
  const cleanHeadline = normalizeWhitespace(headline);

  return `Generated ${style.captionName} artwork inspired by a recent headline about ${theme.sourceTopic}. Source headline: ${cleanHeadline}.`;
}

export function buildCaptionPackage({
  headline,
  style,
}: CaptionPackageInput): CaptionPackage {
  const cleanHeadline = normalizeWhitespace(headline);
  const theme = inferTheme(cleanHeadline);
  const styleProfile = inferStyle(style);

  return {
    caption: buildCaption(theme, styleProfile),
    hashtags: buildHashtags(theme, styleProfile),
    altText: buildAltText(cleanHeadline, theme, styleProfile),
    suggestedFirstComment: getSuggestedFirstComment(theme, styleProfile),
  };
}

export function formatCaptionPackageForShare(captionPackage: CaptionPackage) {
  const hashtagLine = captionPackage.hashtags.join(" ");

  return hashtagLine
    ? `${captionPackage.caption}\n\n${hashtagLine}`
    : captionPackage.caption;
}

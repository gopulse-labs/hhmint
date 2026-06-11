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
}

interface TopicProfile {
  id: string;
  plainTopic: string;
  shortLabel: string;
  reaction: string;
  subject: string;
  tension: string;
  hashtags: string[];
  audienceTags: string[];
  keywords: string[];
}

interface StyleProfile {
  label: string;
  visualLanguage: string;
  mood: string;
  hashtag: string;
}

const GENERIC_HASHTAGS = new Set([
  "#AIArt",
  "#DigitalArt",
  "#Art",
  "#Artist",
  "#InstaArt",
  "#GeneratedArt",
]);

const TOPIC_PROFILES: TopicProfile[] = [
  {
    id: "climate",
    plainTopic: "climate pressure and environmental change",
    shortLabel: "climate pressure",
    reaction: "a warning people keep trying to file away as background noise",
    subject: "the natural system",
    tension: "something measured in charts but felt as instability",
    hashtags: ["#ClimateArt", "#ClimateCommunication"],
    audienceTags: ["#ScienceCommunication"],
    keywords: [
      "climate",
      "warming",
      "carbon",
      "emissions",
      "wildfire",
      "drought",
      "flood",
      "storm",
      "hurricane",
      "ocean",
      "sea",
      "atlantic",
      "arctic",
      "antarctic",
      "glacier",
      "environment",
      "circulation",
    ],
  },
  {
    id: "technology",
    plainTopic: "technology and its human consequences",
    shortLabel: "tech culture",
    reaction: "a technology story with a very human nervous system underneath it",
    subject: "the machine",
    tension: "less like a tool than a set of choices moving faster than trust",
    hashtags: ["#TechCulture", "#TechnologyArt"],
    audienceTags: ["#MediaCriticism"],
    keywords: [
      "ai",
      "artificial intelligence",
      "robot",
      "chip",
      "semiconductor",
      "software",
      "data",
      "algorithm",
      "cyber",
      "internet",
      "openai",
      "google",
      "apple",
      "meta",
      "microsoft",
      "tesla",
    ],
  },
  {
    id: "politics",
    plainTopic: "political power and public trust",
    shortLabel: "political power",
    reaction: "a power story hiding inside procedural language",
    subject: "the public stage",
    tension: "a place where symbols of order keep slipping into performance",
    hashtags: ["#PoliticalArt", "#VisualPolitics"],
    audienceTags: ["#MediaCriticism"],
    keywords: [
      "election",
      "president",
      "congress",
      "senate",
      "supreme court",
      "lawmakers",
      "white house",
      "governor",
      "campaign",
      "vote",
      "policy",
      "government",
      "democrat",
      "republican",
      "trump",
      "biden",
    ],
  },
  {
    id: "science",
    plainTopic: "science, evidence, and uncertainty",
    shortLabel: "scientific uncertainty",
    reaction: "a science story with a little unease tucked beneath the evidence",
    subject: "the experiment",
    tension: "knowledge trying to hold still while the world keeps changing shape",
    hashtags: ["#ScienceArt", "#ScienceCommunication"],
    audienceTags: ["#EditorialIllustration"],
    keywords: [
      "scientist",
      "study",
      "research",
      "discovery",
      "space",
      "nasa",
      "planet",
      "moon",
      "physics",
      "biology",
      "medicine",
      "health",
      "vaccine",
      "virus",
      "disease",
    ],
  },
  {
    id: "economics",
    plainTopic: "economic pressure and public confidence",
    shortLabel: "economic pressure",
    reaction: "a market story that sounded more emotional than the numbers let on",
    subject: "the economy",
    tension: "a system of signals, pressure, and delayed consequences",
    hashtags: ["#EconomicsArt", "#MarketCulture"],
    audienceTags: ["#EditorialIllustration"],
    keywords: [
      "market",
      "stocks",
      "inflation",
      "rates",
      "fed",
      "jobs",
      "economy",
      "economic",
      "recession",
      "tariff",
      "trade",
      "bank",
      "debt",
      "housing",
      "price",
    ],
  },
  {
    id: "culture",
    plainTopic: "culture, attention, and public memory",
    shortLabel: "public attention",
    reaction: "a culture story about what people decide to notice",
    subject: "the public imagination",
    tension: "a mix of taste, memory, spectacle, and exhaustion",
    hashtags: ["#CultureCriticism", "#ContemporaryCulture"],
    audienceTags: ["#MediaCriticism"],
    keywords: [
      "film",
      "music",
      "book",
      "museum",
      "artist",
      "celebrity",
      "streaming",
      "hollywood",
      "culture",
      "media",
      "sports",
      "fashion",
      "history",
      "school",
      "university",
    ],
  },
  {
    id: "urbanism",
    plainTopic: "urban life and public infrastructure",
    shortLabel: "urban systems",
    reaction: "a city story about the systems people have to live inside",
    subject: "the built environment",
    tension: "infrastructure acting less like backdrop and more like fate",
    hashtags: ["#Urbanism", "#CityFutures"],
    audienceTags: ["#EditorialIllustration"],
    keywords: [
      "city",
      "housing",
      "transit",
      "subway",
      "traffic",
      "infrastructure",
      "mayor",
      "urban",
      "neighborhood",
      "zoning",
      "rent",
      "bridge",
      "rail",
    ],
  },
];

const FALLBACK_TOPIC: TopicProfile = {
  id: "news",
  plainTopic: "the human pressure inside the news",
  shortLabel: "the headline",
  reaction: "one of those news items that felt larger than its wording",
  subject: "the headline",
  tension: "a public story turning into a private feeling",
  hashtags: ["#NewsVisuals", "#EditorialIllustration"],
  audienceTags: ["#MediaCriticism"],
  keywords: [],
};

const STYLE_PROFILES: Record<string, StyleProfile> = {
  "abstract expressionist": {
    label: "Abstract Expressionist",
    visualLanguage: "gesture, pressure, and unresolved motion",
    mood: "restless",
    hashtag: "#AbstractExpressionism",
  },
  "art deco": {
    label: "Art Deco",
    visualLanguage: "symmetry, polish, and monumental geometry",
    mood: "controlled",
    hashtag: "#ArtDeco",
  },
  "art nouveau": {
    label: "Art Nouveau",
    visualLanguage: "organic curves, ornament, and fragile elegance",
    mood: "ornate",
    hashtag: "#ArtNouveau",
  },
  "bauhaus": {
    label: "Bauhaus",
    visualLanguage: "clean geometry, utility, and disciplined tension",
    mood: "ordered",
    hashtag: "#Bauhaus",
  },
  "baroque": {
    label: "Baroque",
    visualLanguage: "dramatic contrast, theatrical scale, and heavy motion",
    mood: "charged",
    hashtag: "#BaroqueArt",
  },
  "classical": {
    label: "Classical",
    visualLanguage: "balance, proportion, and formal restraint",
    mood: "measured",
    hashtag: "#ClassicalArt",
  },
  "conceptual": {
    label: "Conceptual",
    visualLanguage: "ideas, absence, and objects carrying more weight than they should",
    mood: "quietly analytical",
    hashtag: "#ConceptualArt",
  },
  "constructivist": {
    label: "Constructivist",
    visualLanguage: "hard diagonals, poster logic, and public urgency",
    mood: "insistent",
    hashtag: "#Constructivism",
  },
  "contemporary": {
    label: "Contemporary",
    visualLanguage: "current visual language, friction, and open-ended symbols",
    mood: "alert",
    hashtag: "#ContemporaryArt",
  },
  "cubist": {
    label: "Cubist",
    visualLanguage: "fractured viewpoints and overlapping planes",
    mood: "unstable",
    hashtag: "#Cubism",
  },
  "dada": {
    label: "Dada",
    visualLanguage: "clipped fragments, wrong-scale objects, and interrupted logic",
    mood: "unsettled",
    hashtag: "#DadaArt",
  },
  "expressionist": {
    label: "Expressionist",
    visualLanguage: "distorted forms, emotional color, and visible strain",
    mood: "uneasy",
    hashtag: "#Expressionism",
  },
  "fauvist": {
    label: "Fauvist",
    visualLanguage: "raw color, simplified forms, and emotional heat",
    mood: "heightened",
    hashtag: "#Fauvism",
  },
  "futurist": {
    label: "Futurist",
    visualLanguage: "speed, machinery, and forward motion that does not feel settled",
    mood: "accelerated",
    hashtag: "#Futurism",
  },
  "graffiti": {
    label: "Graffiti",
    visualLanguage: "street marks, public surfaces, and urgent color",
    mood: "direct",
    hashtag: "#StreetArt",
  },
  "impressionist": {
    label: "Impressionist",
    visualLanguage: "soft edges, shifting light, and partial perception",
    mood: "observational",
    hashtag: "#Impressionism",
  },
  "minimalist": {
    label: "Minimalist",
    visualLanguage: "space, restraint, and only the necessary marks",
    mood: "spare",
    hashtag: "#Minimalism",
  },
  "neoclassical": {
    label: "Neoclassical",
    visualLanguage: "formal order, civic weight, and cool restraint",
    mood: "ceremonial",
    hashtag: "#NeoclassicalArt",
  },
  "pencil drawing": {
    label: "Pencil Drawing",
    visualLanguage: "plain linework, visible marks, and human scale",
    mood: "intimate",
    hashtag: "#Drawing",
  },
  "pointillist": {
    label: "Pointillist",
    visualLanguage: "small marks resolving into a larger pattern",
    mood: "patient",
    hashtag: "#Pointillism",
  },
  "pop art": {
    label: "Pop Art",
    visualLanguage: "bright repetition, media glare, and everyday symbols turned loud",
    mood: "sharp",
    hashtag: "#PopArt",
  },
  "realist": {
    label: "Realist",
    visualLanguage: "plain observation, direct surfaces, and unromantic detail",
    mood: "grounded",
    hashtag: "#Realism",
  },
  "renaissance": {
    label: "Renaissance",
    visualLanguage: "human drama, careful composition, and symbolic weight",
    mood: "formal",
    hashtag: "#RenaissanceArt",
  },
  "rococo": {
    label: "Rococo",
    visualLanguage: "delicate ornament, excess, and decorative tension",
    mood: "ornamental",
    hashtag: "#Rococo",
  },
  "romantic": {
    label: "Romantic",
    visualLanguage: "awe, scale, weather, and emotional landscape",
    mood: "sweeping",
    hashtag: "#Romanticism",
  },
  "surrealist": {
    label: "Surrealist",
    visualLanguage: "dream logic, impossible scale, and quiet unease",
    mood: "strange",
    hashtag: "#SurrealCollage",
  },
  "symbolist": {
    label: "Symbolist",
    visualLanguage: "emblems, allegory, and mood standing in for explanation",
    mood: "suggestive",
    hashtag: "#Symbolism",
  },
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeStyleKey(style: string) {
  return normalizeWhitespace(style).toLowerCase();
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

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function inferTopic(headline: string) {
  const normalized = headline.toLowerCase();

  return TOPIC_PROFILES.find((profile) => includesAny(normalized, profile.keywords)) || FALLBACK_TOPIC;
}

function inferStyle(style: string): StyleProfile {
  const styleKey = normalizeStyleKey(style);

  return STYLE_PROFILES[styleKey] || {
    label: normalizeWhitespace(style) || "Editorial",
    visualLanguage: "composition, symbols, and mood",
    mood: "interpretive",
    hashtag: toHashtag(style || "Editorial Illustration"),
  };
}

function getPlainTopic(headline: string, topic: TopicProfile) {
  const normalized = headline.toLowerCase();

  if (includesAny(normalized, ["atlantic", "ocean", "sea", "circulation", "amoc", "cold blob"])) {
    return "ocean systems and climate instability";
  }

  if (includesAny(normalized, ["space", "nasa", "moon", "planet", "mars", "asteroid"])) {
    return "space science and uncertainty";
  }

  if (includesAny(normalized, ["ai", "artificial intelligence", "algorithm"])) {
    return "AI, technology, and human judgment";
  }

  if (includesAny(normalized, ["housing", "rent", "zoning"])) {
    return "housing pressure and city life";
  }

  if (includesAny(normalized, ["inflation", "rates", "fed", "market", "stocks"])) {
    return "markets, inflation, and public confidence";
  }

  return topic.plainTopic;
}

function getSpecialHashtags(headline: string) {
  const normalized = headline.toLowerCase();
  const tags: string[] = [];

  if (includesAny(normalized, ["atlantic", "ocean", "sea", "circulation", "amoc", "cold blob"])) {
    tags.push("#OceanScience");
  }
  if (includesAny(normalized, ["space", "nasa", "moon", "planet", "mars", "asteroid"])) {
    tags.push("#SpaceScience");
  }
  if (includesAny(normalized, ["ai", "artificial intelligence", "algorithm"])) {
    tags.push("#AI");
  }
  if (includesAny(normalized, ["housing", "rent", "zoning", "transit", "subway"])) {
    tags.push("#Urbanism");
  }
  if (includesAny(normalized, ["election", "vote", "campaign"])) {
    tags.push("#ElectionArt");
  }

  return tags;
}

function uniqueHashtags(candidates: string[]) {
  const seen = new Set<string>();
  const tags: string[] = [];

  for (const candidate of candidates) {
    const normalized = candidate.startsWith("#") ? candidate : `#${candidate}`;
    const key = normalized.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      tags.push(normalized);
    }
  }

  return tags;
}

function buildHashtags(headline: string, topic: TopicProfile, style: StyleProfile) {
  const specificCandidates = uniqueHashtags([
    ...topic.hashtags,
    ...getSpecialHashtags(headline),
    style.hashtag,
    ...topic.audienceTags,
    "#VisualJournalism",
    "#EditorialIllustration",
  ]).filter((tag) => !GENERIC_HASHTAGS.has(tag));

  if (specificCandidates.length >= 3) {
    return specificCandidates.slice(0, 7);
  }

  return uniqueHashtags([...specificCandidates, "#NewsVisuals", "#AIArt"]).slice(0, 7);
}

function buildCaption(
  variant: CaptionVariant,
  plainTopic: string,
  topic: TopicProfile,
  style: StyleProfile
) {
  if (variant === "editorial") {
    return [
      `The headline lands as ${topic.reaction}.`,
      `The ${style.label} language turns ${topic.subject} into ${style.visualLanguage}, making the story feel like ${topic.tension}.`,
      `Based on a recent headline about ${plainTopic}. Made with HeadlineHarmonies.`,
    ].join(" ");
  }

  if (variant === "minimal") {
    return [
      `This one felt like ${topic.shortLabel} under pressure.`,
      `${style.visualLanguage} felt like the right way to hold the mood without overexplaining it.`,
      `Based on a recent headline about ${plainTopic}. Made with HeadlineHarmonies.`,
    ].join(" ");
  }

  return [
    `This headline felt less like a straight news item and more like ${topic.reaction}.`,
    `I pictured ${topic.subject} through ${style.visualLanguage}, with the image leaning into ${style.mood} tension instead of a literal explanation.`,
    `Based on a recent headline about ${plainTopic}. Made with HeadlineHarmonies.`,
  ].join(" ");
}

function buildAltText(headline: string, plainTopic: string, style: StyleProfile) {
  const cleanHeadline = normalizeWhitespace(headline);

  return `Generated ${style.label} artwork inspired by a recent headline about ${plainTopic}. Source headline: ${cleanHeadline}.`;
}

function buildSuggestedFirstComment(variant: CaptionVariant, topic: TopicProfile) {
  if (variant === "editorial") {
    return "The metaphor felt clearer once the image stopped trying to explain the headline directly.";
  }

  if (variant === "minimal") {
    return "I kept this one quieter because the headline already had enough noise.";
  }

  return `I was trying to make ${topic.shortLabel} feel less abstract here.`;
}

export function buildCaptionPackage({
  headline,
  style,
  variant = "personal",
}: CaptionPackageInput): CaptionPackage {
  const cleanHeadline = normalizeWhitespace(headline);
  const topic = inferTopic(cleanHeadline);
  const styleProfile = inferStyle(style);
  const plainTopic = getPlainTopic(cleanHeadline, topic);

  return {
    caption: buildCaption(variant, plainTopic, topic, styleProfile),
    hashtags: buildHashtags(cleanHeadline, topic, styleProfile),
    altText: buildAltText(cleanHeadline, plainTopic, styleProfile),
    suggestedFirstComment: buildSuggestedFirstComment(variant, topic),
  };
}

export function formatCaptionPackageForShare(captionPackage: CaptionPackage) {
  const hashtagLine = captionPackage.hashtags.join(" ");

  return hashtagLine
    ? `${captionPackage.caption}\n\n${hashtagLine}`
    : captionPackage.caption;
}

import { createHash } from "crypto";
import OpenAI from "openai";
import { buildCaptionPackage, type CaptionPackage } from "./captionPackage";

export const DEFAULT_CAPTION_MODEL_CANDIDATES = [
  "gpt-5-nano",
  "gpt-4.1-nano",
  "gpt-4.1-mini",
];

export interface VisionCaptionPackageInput {
  headline: string;
  style: string;
  imageBase64?: string;
  imageMimeType?: string;
  imagePrompt?: string;
  apiKey?: string;
  modelOverride?: string;
}

interface VisionCaptionPackageOptions {
  openaiClient?: CaptionOpenAIClient;
  modelCandidates?: string[];
  cache?: Map<string, CaptionPackage>;
}

type CaptionOpenAIClient = {
  chat: {
    completions: {
      create: (params: Record<string, unknown>) => Promise<unknown>;
    };
  };
};

type RawCaptionPackage = {
  headlineTension?: unknown;
  visibleDetails?: unknown;
  styleFit?: unknown;
  caption?: unknown;
  hashtags?: unknown;
  altText?: unknown;
  suggestedFirstComment?: unknown;
};

const CAPTION_CACHE_MAX_SIZE = 50;
const captionCache = new Map<string, CaptionPackage>();

const GENERIC_HASHTAGS = new Set([
  "#aiart",
  "#digitalart",
  "#art",
  "#artist",
  "#instaart",
  "#generatedart",
]);

const FALLBACK_HASHTAGS = [
  "#EditorialIllustration",
  "#VisualJournalism",
  "#NewsVisuals",
];

const BANNED_FILLER_PHRASES = [
  "political power feel closer",
  "symbols of order",
  "public trust",
  "human pressure inside the news",
  "larger than its wording",
  "interpretive tension",
  "visual language",
  "composition, symbols, and mood",
  "composition symbols and mood",
  "political power",
  "quiet unease",
  "dream logic",
  "impossible scale",
  "refuses to become simple",
  "this space science headline",
  "this climate headline",
  "this politics headline",
  "this ai headline",
  "this market headline",
];

const ENGAGEMENT_BAIT_PHRASES = [
  "what do you think",
  "drop your thoughts",
  "comment below",
  "let me know",
  "thoughts?",
];

const REPORTY_CAPTION_PHRASES = [
  "this image shows",
  "the image shows",
  "this artwork shows",
  "highlight the",
  "highlights the",
  "depict the",
  "depicts the",
  "symbolize the",
  "symbolizes the",
];

const SUMMARY_COMMENT_PHRASES = [
  "after the",
  "because of",
  "doing a lot here",
  "headline",
  "impact of",
  "represents",
  "show the",
  "shows the",
  "symbolic",
  "this explores",
  "visualize",
];

const HYPE_PHRASES = [
  "captures the chaos",
  "chaotic energy",
  "dramatic scene",
  "perfectly",
  "world tensions",
];

const GENERIC_VISIBLE_DETAIL_PATTERNS = [
  /^bold lines?$/i,
  /^chaos$/i,
  /^chaotic energy$/i,
  /^dramatic scene$/i,
  /^graffiti$/i,
  /^graffiti style$/i,
  /^market chaos$/i,
  /^scene$/i,
  /^style$/i,
  /^tension$/i,
  /^world tensions?$/i,
];

const CONCRETE_FEELING_WORDS = [
  "cold",
  "fragile",
  "lonely",
  "optimistic",
  "pause",
  "resolution",
  "stable",
  "strange",
  "tense",
  "unstable",
  "warning",
  "weird",
];

const TOKEN_STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "because",
  "being",
  "between",
  "feels",
  "from",
  "headline",
  "image",
  "into",
  "less",
  "like",
  "made",
  "more",
  "scene",
  "story",
  "style",
  "that",
  "their",
  "there",
  "thing",
  "this",
  "with",
  "works",
]);

export function getCaptionModelCandidates(modelOverride?: string) {
  const cleanOverride = modelOverride?.trim();
  const candidates = cleanOverride ? [cleanOverride] : DEFAULT_CAPTION_MODEL_CANDIDATES;
  const captionCandidates = candidates.filter((model) => !isImageGenerationModel(model));

  return captionCandidates.length ? captionCandidates : DEFAULT_CAPTION_MODEL_CANDIDATES;
}

export async function buildVisionCaptionPackage(
  input: VisionCaptionPackageInput,
  options: VisionCaptionPackageOptions = {}
): Promise<CaptionPackage> {
  const fallbackPackage = markAsFallback(buildCaptionPackage({
    headline: input.headline,
    style: input.style,
  }));
  const imageBase64 = input.imageBase64?.trim();
  const canCallModel = Boolean(imageBase64 && (input.apiKey || options.openaiClient));

  if (!canCallModel) {
    return fallbackPackage;
  }

  const cache = options.cache || captionCache;
  const cacheKey = buildCacheKey(input);
  const cachedPackage = cache.get(cacheKey);

  if (cachedPackage) {
    return cachedPackage;
  }

  const modelCandidates = options.modelCandidates || getCaptionModelCandidates(input.modelOverride);
  const client = options.openaiClient || new OpenAI({ apiKey: input.apiKey }) as unknown as CaptionOpenAIClient;

  for (const model of modelCandidates) {
    try {
      const response = await client.chat.completions.create(
        buildCaptionRequest(input, model, imageBase64 || "")
      );
      const rawPackage = parseCaptionPackageResponse(response);
      const sanitizedPackage = sanitizeModelPackage(rawPackage, fallbackPackage, model, input);

      if (sanitizedPackage) {
        writeCache(cache, cacheKey, sanitizedPackage);
        return sanitizedPackage;
      }
    } catch (error) {
      console.warn(`Caption package model failed for ${model}; using fallback if no candidate succeeds.`, error);
    }
  }

  return fallbackPackage;
}

function buildCaptionRequest(input: VisionCaptionPackageInput, model: string, imageBase64: string) {
  const imageMimeType = input.imageMimeType || "image/jpeg";
  const sourceDetails = [
    `Headline: ${normalizeWhitespace(input.headline)}`,
    `Selected style: ${normalizeWhitespace(input.style)}`,
    input.imagePrompt
      ? `Original image-generation prompt: ${normalizeWhitespace(input.imagePrompt)}`
      : "Original image-generation prompt: not provided",
  ].join("\n");

  return {
    model,
    temperature: 0.2,
    max_completion_tokens: 420,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "You write short Instagram caption packages for HeadlineHarmonies.",
          "Return strict JSON only, with exactly these keys: headlineTension, visibleDetails, styleFit, caption, hashtags, altText, suggestedFirstComment.",
          "headlineTension: one plain sentence naming the headline's specific tension, not just a broad category.",
          "visibleDetails: an array of 1 to 4 short concrete details that are clearly visible in the image, such as missiles, a handshake, a dove, red warning marks, a red downward arrow, rough wall texture, a green bull, an oil barrel, a telescope, a planet, a courtroom bench, floodwater, or a street poster. Do not include uncertain details.",
          "Do not use generic style traits or abstractions as visibleDetails: no bold lines, chaotic energy, dramatic scene, market chaos, mood, or tension unless they are tied to a concrete object.",
          "styleFit: one plain sentence explaining why the selected art style fits this headline tension.",
          "Caption structure: sentence 1 names the headline's main theme, contradiction, or tension in plain language; sentence 2 explains why the selected artistic style works, using at least one concrete visible detail from the image; final sentence is exactly: Made with HeadlineHarmonies.",
          "Do not start captions with 'This image shows', 'The image shows', or 'This artwork shows'. Do not use report verbs like highlights, depicts, or symbolizes.",
          "Do not contradict the headline. If the headline says stocks jump, do not call it a market crash. If the headline says oil tumbles, do not say oil rises.",
          "Write like a real person: simple, specific, slightly informal, and not like an artist statement.",
          "Mention only visual details that are clearly visible. If uncertain, use broad visual language like a negotiation scene, military imagery, a bird, a red warning shape, or a surreal landscape.",
          "Do not claim the image shows a real event or documentary evidence. Do not identify real people from the image itself.",
          "Hashtags: 3 to 7, specific topic/style/audience tags, no default #AIArt #DigitalArt #Art #InstaArt #GeneratedArt.",
          "Alt text: plain accessibility description of what is visible, not poetic.",
          "Suggested first comment: under 110 characters when possible, casual, concrete, and not engagement bait. It should sound like an aside from the person posting, not a summary of the news.",
          "Avoid vague phrases like political power, symbols of order, public trust, human pressure inside the news, larger than its wording, interpretive tension, visual language, composition symbols and mood, quiet unease, dream logic, impossible scale, or refuses to become simple.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: sourceDetails,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${imageMimeType};base64,${imageBase64}`,
              detail: "low",
            },
          },
        ],
      },
    ],
  };
}

function parseCaptionPackageResponse(response: unknown): RawCaptionPackage | null {
  const content = getResponseContent(response);

  if (!content) {
    return null;
  }

  try {
    const parsed = JSON.parse(content.trim());

    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function getResponseContent(response: unknown) {
  if (!isRecord(response)) return null;

  const choices = response.choices;
  if (!Array.isArray(choices) || !choices[0] || !isRecord(choices[0])) return null;

  const message = choices[0].message;
  if (!isRecord(message) || typeof message.content !== "string") return null;

  return message.content;
}

function sanitizeModelPackage(
  rawPackage: RawCaptionPackage | null,
  fallbackPackage: CaptionPackage,
  modelUsed: string,
  input: VisionCaptionPackageInput
): CaptionPackage | null {
  if (!rawPackage) return null;
  if (
    typeof rawPackage.headlineTension !== "string" ||
    !Array.isArray(rawPackage.visibleDetails) ||
    typeof rawPackage.styleFit !== "string" ||
    typeof rawPackage.caption !== "string" ||
    !Array.isArray(rawPackage.hashtags) ||
    typeof rawPackage.altText !== "string" ||
    typeof rawPackage.suggestedFirstComment !== "string"
  ) {
    return null;
  }

  const headlineTension = sanitizeHeadlineTension(
    rawPackage.headlineTension,
    fallbackPackage,
    input.headline
  );
  const visibleDetails = sanitizeVisibleDetails(rawPackage.visibleDetails);
  const styleFit = sanitizeRequiredString(rawPackage.styleFit);
  const caption = sanitizeCaption(rawPackage.caption, {
    headline: input.headline,
    headlineTension,
    visibleDetails,
    styleFit,
  });
  const hashtags = sanitizeHashtags(rawPackage.hashtags, fallbackPackage.hashtags, input.headline);
  const altText = normalizeWhitespace(rawPackage.altText);
  const suggestedFirstComment =
    sanitizeSuggestedFirstComment(rawPackage.suggestedFirstComment, visibleDetails) ||
    buildVisionFirstComment(visibleDetails);

  if (
    !headlineTension ||
    !visibleDetails.length ||
    !styleFit ||
    !caption ||
    !altText ||
    containsBannedFiller(altText) ||
    !suggestedFirstComment ||
    hashtags.length < 3
  ) {
    return null;
  }

  return {
    caption,
    hashtags,
    altText,
    suggestedFirstComment,
    modelUsed,
    usedFallback: false,
  };
}

function sanitizeCaption(
  value: string,
  context: {
    headline: string;
    headlineTension: string | null;
    visibleDetails: string[];
    styleFit: string | null;
  }
) {
  const withoutHashtags = value.replace(/(^|\s)#[A-Za-z0-9_]+/g, " ");
  const withoutAttribution = withoutHashtags.replace(/made with headlineharmonies\.?/gi, " ");
  const caption = normalizeWhitespace(withoutAttribution);
  const structuredCaption = buildStructuredCaption(context.headlineTension, context.styleFit);
  const captionToUse = (
    caption &&
    !containsBannedFiller(caption) &&
    !containsHype(caption) &&
    !containsReportyCaption(caption) &&
    !contradictsHeadline(caption, context.headline) &&
    sharesMeaningfulToken(caption, context.headlineTension || "") &&
    sharesMeaningfulToken(caption, context.styleFit || "") &&
    mentionsVisibleDetail(caption, context.visibleDetails)
  )
    ? caption
    : structuredCaption;

  if (
    !captionToUse ||
    containsBannedFiller(captionToUse) ||
    containsHype(captionToUse) ||
    containsReportyCaption(captionToUse) ||
    contradictsHeadline(captionToUse, context.headline) ||
    !sharesMeaningfulToken(captionToUse, context.headlineTension || "") ||
    !sharesMeaningfulToken(captionToUse, context.styleFit || "") ||
    !mentionsVisibleDetail(captionToUse, context.visibleDetails)
  ) {
    return null;
  }

  return `${captionToUse.replace(/[.?!]?$/, ".")} Made with HeadlineHarmonies.`;
}

function sanitizeSuggestedFirstComment(value: string, visibleDetails: string[]) {
  const comment = normalizeWhitespace(value);

  if (
    !comment ||
    containsEngagementBait(comment) ||
    containsBannedFiller(comment) ||
    containsHype(comment) ||
    containsSummaryComment(comment) ||
    (!mentionsVisibleDetail(comment, visibleDetails) && !containsConcreteFeeling(comment))
  ) {
    return null;
  }

  if (comment.length <= 160) {
    return comment;
  }

  const sentenceBreak = comment.slice(0, 157).search(/[.?!][^.?!]*$/);
  if (sentenceBreak > 40) {
    return comment.slice(0, sentenceBreak + 1).trim();
  }

  return `${comment.slice(0, 157).trim()}...`;
}

function buildStructuredCaption(headlineTension: string | null, styleFit: string | null) {
  if (!headlineTension || !styleFit) return null;

  return normalizeWhitespace(`${headlineTension.replace(/[.?!]?$/, ".")} ${styleFit}`);
}

function buildVisionFirstComment(visibleDetails: string[]) {
  const detail = visibleDetails.find((candidate) => candidate.length <= 48) || visibleDetails[0];
  const displayDetail = detail ? decapitalizeDetail(detail) : null;
  const subject = displayDetail?.split(/\s+(with|against|near|beside)\s+/i)[0] || "";
  const verb = subject && /s$/i.test(subject) ? "are" : "is";

  return displayDetail ? `The ${displayDetail} ${verb} doing a lot here.` : null;
}

function sanitizeRequiredString(value: string) {
  const cleanValue = normalizeWhitespace(value);

  return cleanValue && !containsBannedFiller(cleanValue) && !containsHype(cleanValue) ? cleanValue : null;
}

function sanitizeHeadlineTension(value: string, fallbackPackage: CaptionPackage, headline: string) {
  const cleanValue = sanitizeRequiredString(value);

  if (!cleanValue || contradictsHeadline(cleanValue, headline)) {
    return firstSentence(fallbackPackage.caption);
  }

  return cleanValue;
}

function sanitizeVisibleDetails(rawDetails: unknown[]) {
  const details: string[] = [];

  for (const detail of rawDetails) {
    if (typeof detail !== "string") continue;

    const cleanDetail = normalizeWhitespace(detail);
    if (!cleanDetail || containsBannedFiller(cleanDetail)) continue;
    if (containsHype(cleanDetail) || isGenericVisibleDetail(cleanDetail)) continue;
    if (!meaningfulTokens(cleanDetail).length) continue;
    if (details.some((existingDetail) => existingDetail.toLowerCase() === cleanDetail.toLowerCase())) continue;

    details.push(cleanDetail);
  }

  return details.slice(0, 4);
}

function sanitizeHashtags(rawHashtags: unknown[], fallbackHashtags: string[], headline: string) {
  const tags: string[] = [];

  for (const rawHashtag of rawHashtags) {
    if (typeof rawHashtag !== "string") continue;

    const candidates = rawHashtag.match(/#?[A-Za-z0-9_]+/g) || [];
    for (const candidate of candidates) {
      addHashtag(tags, candidate, headline);
    }
  }

  if (tags.length < 3) {
    for (const fallbackTag of fallbackHashtags) {
      addHashtag(tags, fallbackTag, headline);
    }
  }

  if (tags.length < 3) {
    for (const fallbackTag of FALLBACK_HASHTAGS) {
      addHashtag(tags, fallbackTag, headline);
    }
  }

  return tags.slice(0, 7);
}

function addHashtag(tags: string[], value: string, headline: string) {
  const cleaned = value
    .replace(/^#+/, "")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .trim();

  if (!cleaned) return;
  if (contradictsHeadline(cleaned, headline)) return;

  const hashtag = `#${cleaned}`;
  const key = hashtag.toLowerCase();

  if (GENERIC_HASHTAGS.has(key)) return;
  if (tags.some((tag) => tag.toLowerCase() === key)) return;

  tags.push(hashtag);
}

function containsBannedFiller(value: string) {
  const normalized = value.toLowerCase();

  return BANNED_FILLER_PHRASES.some((phrase) => normalized.includes(phrase));
}

function containsEngagementBait(value: string) {
  const normalized = value.toLowerCase();

  return ENGAGEMENT_BAIT_PHRASES.some((phrase) => normalized.includes(phrase));
}

function containsReportyCaption(value: string) {
  const normalized = value.toLowerCase();

  return REPORTY_CAPTION_PHRASES.some((phrase) => normalized.includes(phrase));
}

function containsSummaryComment(value: string) {
  const normalized = value.toLowerCase();

  return SUMMARY_COMMENT_PHRASES.some((phrase) => normalized.includes(phrase));
}

function containsHype(value: string) {
  const normalized = value.toLowerCase();

  return HYPE_PHRASES.some((phrase) => normalized.includes(phrase));
}

function isGenericVisibleDetail(value: string) {
  const normalized = normalizeWhitespace(value);

  return GENERIC_VISIBLE_DETAIL_PATTERNS.some((pattern) => pattern.test(normalized));
}

function contradictsHeadline(value: string, headline: string) {
  const normalizedValue = value.toLowerCase();
  const normalizedHeadline = headline.toLowerCase();

  if (/(jumps|jumped|rallies|rally|soars|surges|gains|up)/.test(normalizedHeadline) && /(crash|crashes|crashed|plunge|plunges|collapse|collapses)/.test(normalizedValue)) {
    return true;
  }

  if (/(tumbles|tumbled|falls|fell|drops|dropped|down)/.test(normalizedHeadline) && /(rises|rose|rally|rallies|surges|soars|jumps)/.test(normalizedValue)) {
    return true;
  }

  return false;
}

function firstSentence(value: string) {
  return normalizeWhitespace(value).split(/(?<=[.?!])\s+/)[0] || normalizeWhitespace(value);
}

function decapitalizeDetail(value: string) {
  const cleanValue = normalizeWhitespace(value);

  return /^[A-Z][a-z]/.test(cleanValue)
    ? `${cleanValue.charAt(0).toLowerCase()}${cleanValue.slice(1)}`
    : cleanValue;
}

function containsConcreteFeeling(value: string) {
  const normalized = value.toLowerCase();

  return CONCRETE_FEELING_WORDS.some((word) => new RegExp(`(^|[^a-z0-9])${word}([^a-z0-9]|$)`, "i").test(normalized));
}

function mentionsVisibleDetail(value: string, visibleDetails: string[]) {
  return visibleDetails.some((detail) => sharesMeaningfulToken(value, detail));
}

function sharesMeaningfulToken(value: string, source: string) {
  const valueTokens = new Set(meaningfulTokens(value));

  return meaningfulTokens(source).some((token) => valueTokens.has(token));
}

function meaningfulTokens(value: string) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(" ")
    .filter((token) => token.length >= 4 && !TOKEN_STOP_WORDS.has(token));
}

function isImageGenerationModel(model: string) {
  return /^(gpt-image|dall-e)/i.test(model.trim());
}

function markAsFallback(captionPackage: CaptionPackage): CaptionPackage {
  return {
    ...captionPackage,
    usedFallback: true,
  };
}

function buildCacheKey(input: VisionCaptionPackageInput) {
  const hash = createHash("sha256");

  hash.update(normalizeWhitespace(input.headline));
  hash.update("\0");
  hash.update(normalizeWhitespace(input.style));
  hash.update("\0");
  hash.update(normalizeWhitespace(input.imagePrompt || ""));
  hash.update("\0");
  hash.update(input.imageBase64 || "");

  return hash.digest("hex");
}

function writeCache(cache: Map<string, CaptionPackage>, key: string, value: CaptionPackage) {
  if (cache.size >= CAPTION_CACHE_MAX_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }

  cache.set(key, value);
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

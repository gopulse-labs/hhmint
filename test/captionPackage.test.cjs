const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

require.extensions[".ts"] = function registerTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      esModuleInterop: true,
    },
    fileName: filename,
  });

  module._compile(output.outputText, filename);
};

const {
  buildCaptionPackage,
  formatCaptionPackageForShare,
} = require(path.join(__dirname, "../src/lib/captionPackage.ts"));
const {
  buildVisionCaptionPackage,
  getCaptionModelCandidates,
} = require(path.join(__dirname, "../src/lib/visionCaptionPackage.ts"));

const trumpIranHeadline = "Trump Cancels Iran Strikes, Says Tehran Has 'Approved' Talks";
const marketIranHeadline =
  "Dow jumps 800 points, oil tumbles as Trump cancels evening strikes against Iran: Live updates";
const climateHeadline =
  "El Niño forms in Pacific as experts say it will likely turbocharge extreme weather";
const courtHeadline =
  "New Hampshire Supreme Court overturns Adam Montgomery's second-degree murder conviction";
const flashpointHeadline =
  "How Karmelo Anthony's stabbing case became a racial flashpoint in Texas";
const jupiterHeadline =
  "New telescope images reveal strange storms on Jupiter";
const aiLaborHeadline =
  "AI tools are changing hiring and office jobs faster than workers expected";
const knicksHeadline =
  "Knicks stage historic Game 4 comeback against Spurs, 1 win away from title - The Athletic";
const componentSource = fs.readFileSync(
  path.join(__dirname, "../src/components/HHMint.tsx"),
  "utf8"
);
const generateImageSource = fs.readFileSync(
  path.join(__dirname, "../src/pages/api/generateImage.ts"),
  "utf8"
);
const visionCaptionSource = fs.readFileSync(
  path.join(__dirname, "../src/lib/visionCaptionPackage.ts"),
  "utf8"
);

const fillerPhrases = [
  /political power feel closer/i,
  /symbols of order/i,
  /public trust/i,
  /human pressure inside the news/i,
  /larger than its wording/i,
  /interpretive tension/i,
  /visual language/i,
  /composition, symbols, and mood/i,
  /quiet unease/i,
  /dream logic/i,
  /impossible scale/i,
  /refuses to become simple/i,
  /This space science headline/i,
  /This climate headline/i,
  /This politics headline/i,
  /This AI headline/i,
  /This market headline/i,
];

const mockedImageInput = {
  headline: trumpIranHeadline,
  style: "Graffiti",
  imageBase64: Buffer.from("mock image bytes").toString("base64"),
  imageMimeType: "image/jpeg",
  imagePrompt: "Mock image prompt with a negotiation scene and warning marks.",
  apiKey: "test-key",
};

function createMockCaptionClient({ content, error }) {
  const calls = [];

  return {
    calls,
    client: {
      chat: {
        completions: {
          create: async (params) => {
            calls.push(params);

            if (error) {
              throw error;
            }

            return {
              choices: [
                {
                  message: {
                    content,
                  },
                },
              ],
            };
          },
        },
      },
    },
  };
}

const validVisionCaptionJson = JSON.stringify({
  headlineTension:
    "The headline is basically about brinkmanship: military threat on one side, diplomatic talks on the other, and uncertainty over which one is real.",
  visibleDetails: ["missiles", "handshake", "red warning marks", "rough graffiti texture"],
  styleFit:
    "The graffiti style works because the missiles, handshake, and red warning marks make the scene feel public and unstable.",
  caption:
    "The headline is basically about brinkmanship: military threat on one side, diplomatic talks on the other, and uncertainty over which one is real. The graffiti style works because the missiles, handshake, and red warning marks make the scene feel public and unstable. Made with HeadlineHarmonies.",
  hashtags: [
    "#PoliticalArt",
    "#ForeignPolicy",
    "#Diplomacy",
    "#VisualJournalism",
    "#StreetArt",
    "#EditorialIllustration",
    "#AIArt",
    "#GeneratedArt",
    "#ExtraTag",
  ],
  altText:
    "A stylized street-poster scene with military imagery, a handshake, red warning marks, and rough graffiti texture.",
  suggestedFirstComment:
    "The red warning marks make the handshake feel less reassuring.",
});

test("Trump/Iran caption names the concrete brinkmanship tension", () => {
  const captionPackage = buildCaptionPackage({
    headline: trumpIranHeadline,
    style: "Pencil Drawing",
  });

  assert.match(captionPackage.caption, /brinkmanship/i);
  assert.match(captionPackage.caption, /military threat|strikes|missiles/i);
  assert.match(captionPackage.caption, /diplomatic talks|talks|diplomacy|negotiation/i);
  assert.doesNotMatch(captionPackage.caption, /political power and public trust/i);
});

test("caption explains why the selected style fits the headline theme", () => {
  const captionPackage = buildCaptionPackage({
    headline: trumpIranHeadline,
    style: "Pencil Drawing",
  });

  assert.match(captionPackage.caption, /pencil-sketch style works/i);
  assert.match(captionPackage.caption, /provisional|draft|settled decision/i);
  assert.match(captionPackage.caption, /Made with HeadlineHarmonies\./);
});

test("climate and space captions use simple theme plus style-fit structure", () => {
  const climatePackage = buildCaptionPackage({
    headline: climateHeadline,
    style: "Surrealist",
  });
  const spacePackage = buildCaptionPackage({
    headline: jupiterHeadline,
    style: "Surrealist",
  });

  assert.match(climatePackage.caption, /weather becoming harder|oceans|heat|extreme conditions/i);
  assert.match(climatePackage.caption, /surreal style works|physical and unstable|chart/i);
  assert.match(spacePackage.caption, /discovery, but also distance|seeing farther/i);
  assert.match(spacePackage.caption, /surreal style works|space feel less like a diagram|private dream/i);
});

test("AI and labor captions use technology-speed tension without generic AI-art filler", () => {
  const captionPackage = buildCaptionPackage({
    headline: aiLaborHeadline,
    style: "Futurist",
  });

  assert.match(captionPackage.caption, /technology moving faster|people can emotionally process|systems/i);
  assert.match(captionPackage.caption, /futurist style works|future look fast|out of control/i);
  assert.doesNotMatch(captionPackage.caption, /AIArt|DigitalArt|visual language/i);
  assert.ok(captionPackage.hashtags.includes("#TechCulture"));
});

test("court and public-flashpoint captions extract specific story tensions", () => {
  const courtPackage = buildCaptionPackage({
    headline: courtHeadline,
    style: "Minimalist",
  });
  const flashpointPackage = buildCaptionPackage({
    headline: flashpointHeadline,
    style: "Expressionist",
  });

  assert.match(courtPackage.caption, /legal reversal|conviction|doubt/i);
  assert.match(courtPackage.caption, /minimalist style works|legal uncertainty|coldest/i);
  assert.match(flashpointPackage.caption, /violence|race|outrage|competing versions/i);
  assert.match(flashpointPackage.caption, /expressionist style works|grief|anger|panic/i);
});

test("captions avoid vague abstract filler phrases", () => {
  const captionPackage = buildCaptionPackage({
    headline: trumpIranHeadline,
    style: "Pencil Drawing",
  });

  for (const phrase of fillerPhrases) {
    assert.doesNotMatch(captionPackage.caption, phrase);
  }
});

test("suggested first comments are short, casual, concrete, and separate", () => {
  const captionPackage = buildCaptionPackage({
    headline: trumpIranHeadline,
    style: "Pencil Drawing",
  });
  const shareText = formatCaptionPackageForShare(captionPackage);

  assert.ok(captionPackage.suggestedFirstComment.length > 0);
  assert.ok(captionPackage.suggestedFirstComment.length <= 110);
  assert.match(captionPackage.suggestedFirstComment, /sketch|erased|redrawn|pause|resolution|missiles|handshake|peaceful/i);
  assert.doesNotMatch(captionPackage.suggestedFirstComment, /trying to make|explores the relationship|What do you think|Drop your thoughts|symbolic meaning/i);
  assert.equal(shareText.includes(captionPackage.suggestedFirstComment), false);
});

test("hashtags remain capped and topic/style-specific", () => {
  const captionPackage = buildCaptionPackage({
    headline: trumpIranHeadline,
    style: "Pencil Drawing",
  });

  assert.ok(captionPackage.hashtags.length >= 3);
  assert.ok(captionPackage.hashtags.length <= 7);
  assert.ok(captionPackage.hashtags.includes("#PoliticalArt"));
  assert.ok(captionPackage.hashtags.includes("#ForeignPolicy"));
  assert.ok(captionPackage.hashtags.includes("#Diplomacy"));
  assert.ok(captionPackage.hashtags.includes("#VisualJournalism"));
  assert.ok(captionPackage.hashtags.includes("#Drawing"));
  assert.equal(captionPackage.hashtags.includes("#AIArt"), false);
});

test("sports headlines are not misclassified as AI because of substring matches", () => {
  const captionPackage = buildCaptionPackage({
    headline: knicksHeadline,
    style: "Neoclassical",
  });

  assert.match(captionPackage.caption, /comeback becoming bigger than the game|basketball/i);
  assert.doesNotMatch(captionPackage.caption, /This AI story|control panel|technology moving faster/i);
  assert.ok(captionPackage.hashtags.includes("#BasketballArt"));
  assert.ok(captionPackage.hashtags.includes("#SportsCulture"));
});

test("formatted share text includes caption and hashtags only", () => {
  const captionPackage = buildCaptionPackage({
    headline: climateHeadline,
    style: "Surrealist",
  });
  const shareText = formatCaptionPackageForShare(captionPackage);

  assert.ok(shareText.includes(captionPackage.caption));
  for (const tag of captionPackage.hashtags) {
    assert.ok(shareText.includes(tag));
  }
  assert.equal(shareText.includes(captionPackage.suggestedFirstComment), false);
});

test("vision caption package uses model JSON when valid", async () => {
  const mock = createMockCaptionClient({ content: validVisionCaptionJson });
  const captionPackage = await buildVisionCaptionPackage(mockedImageInput, {
    openaiClient: mock.client,
    modelCandidates: ["test-vision"],
    cache: new Map(),
  });

  assert.equal(captionPackage.usedFallback, false);
  assert.equal(captionPackage.modelUsed, "test-vision");
  assert.match(captionPackage.caption, /military threat|diplomatic talks|brinkmanship/i);
  assert.match(captionPackage.caption, /missiles|handshake|red warning marks/i);
  assert.doesNotMatch(captionPackage.caption, /political power and public trust/i);
  assert.match(captionPackage.caption, /Made with HeadlineHarmonies\./);
  assert.ok(captionPackage.hashtags.length >= 3);
  assert.ok(captionPackage.hashtags.length <= 7);
  assert.equal(captionPackage.hashtags.includes("#AIArt"), false);
  assert.equal(captionPackage.hashtags.includes("#GeneratedArt"), false);
  assert.match(captionPackage.suggestedFirstComment, /red warning marks|handshake/i);
});

test("vision caption request uses low-detail image input and the selected caption model", async () => {
  const mock = createMockCaptionClient({ content: validVisionCaptionJson });
  await buildVisionCaptionPackage(mockedImageInput, {
    openaiClient: mock.client,
    modelCandidates: ["test-vision"],
    cache: new Map(),
  });

  assert.equal(mock.calls.length, 1);
  assert.equal(mock.calls[0].model, "test-vision");
  assert.equal(mock.calls[0].max_completion_tokens <= 420, true);

  const userMessage = mock.calls[0].messages.find((message) => message.role === "user");
  const imagePart = userMessage.content.find((part) => part.type === "image_url");
  assert.equal(imagePart.image_url.detail, "low");
  assert.match(imagePart.image_url.url, /^data:image\/jpeg;base64,/);
});

test("vision caption prompt requires structured tension, visible details, and style fit", async () => {
  const mock = createMockCaptionClient({ content: validVisionCaptionJson });
  await buildVisionCaptionPackage(mockedImageInput, {
    openaiClient: mock.client,
    modelCandidates: ["test-vision"],
    cache: new Map(),
  });

  const systemMessage = mock.calls[0].messages.find((message) => message.role === "system");
  assert.match(systemMessage.content, /headlineTension, visibleDetails, styleFit, caption, hashtags, altText, suggestedFirstComment/);
  assert.match(systemMessage.content, /visibleDetails: an array of 1 to 4 short concrete details/);
  assert.match(systemMessage.content, /Return strict JSON only/);
});

test("caption model candidates do not use image-generation models", () => {
  assert.deepEqual(getCaptionModelCandidates("gpt-image-2"), [
    "gpt-5-nano",
    "gpt-4.1-nano",
    "gpt-4.1-mini",
  ]);
  assert.deepEqual(getCaptionModelCandidates("gpt-4.1-mini"), ["gpt-4.1-mini"]);
});

test("vision caption package falls back when the model call fails", async () => {
  const mock = createMockCaptionClient({ content: "", error: new Error("model unavailable") });
  const originalWarn = console.warn;
  console.warn = () => {};

  let captionPackage;
  try {
    captionPackage = await buildVisionCaptionPackage(mockedImageInput, {
      openaiClient: mock.client,
      modelCandidates: ["test-vision"],
      cache: new Map(),
    });
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(captionPackage.usedFallback, true);
  assert.match(captionPackage.caption, /brinkmanship/i);
  assert.match(captionPackage.caption, /Made with HeadlineHarmonies\./);
});

test("vision caption package falls back when JSON is malformed", async () => {
  const mock = createMockCaptionClient({ content: "not json" });
  const captionPackage = await buildVisionCaptionPackage(mockedImageInput, {
    openaiClient: mock.client,
    modelCandidates: ["test-vision"],
    cache: new Map(),
  });

  assert.equal(captionPackage.usedFallback, true);
  assert.match(captionPackage.caption, /brinkmanship/i);
});

test("vision caption package falls back when required fields are missing", async () => {
  const mock = createMockCaptionClient({
    content: JSON.stringify({
      caption: "A partial caption. Made with HeadlineHarmonies.",
      hashtags: ["#PoliticalArt", "#Diplomacy", "#StreetArt"],
    }),
  });
  const captionPackage = await buildVisionCaptionPackage(mockedImageInput, {
    openaiClient: mock.client,
    modelCandidates: ["test-vision"],
    cache: new Map(),
  });

  assert.equal(captionPackage.usedFallback, true);
  assert.match(captionPackage.altText, /Source headline/);
});

test("vision caption package falls back when caption omits visible image details", async () => {
  const mock = createMockCaptionClient({
    content: JSON.stringify({
      headlineTension:
        "The headline is about military threat and diplomacy happening at the same time.",
      visibleDetails: ["missiles", "handshake", "red warning marks"],
      styleFit:
        "The graffiti style works because the rough public texture makes the diplomacy feel unstable.",
      caption:
        "The headline is about military threat and diplomacy happening at the same time. The graffiti style works because the whole story feels unstable. Made with HeadlineHarmonies.",
      hashtags: ["#PoliticalArt", "#ForeignPolicy", "#Diplomacy"],
      altText:
        "A graffiti-style political scene with military imagery, warning marks, and rough wall texture.",
      suggestedFirstComment: "The red warning marks are doing a lot here.",
    }),
  });
  const captionPackage = await buildVisionCaptionPackage(mockedImageInput, {
    openaiClient: mock.client,
    modelCandidates: ["test-vision"],
    cache: new Map(),
  });

  assert.equal(captionPackage.usedFallback, true);
  assert.match(captionPackage.caption, /brinkmanship/i);
});

test("vision caption package removes banned filler and engagement bait from final output", async () => {
  const mock = createMockCaptionClient({
    content: JSON.stringify({
      headlineTension:
        "The headline is about military threat and diplomacy happening at the same time.",
      visibleDetails: ["missiles", "handshake", "red warning marks"],
      styleFit:
        "The graffiti style works because the warning marks make the diplomacy feel unstable.",
      caption:
        "This political power story explores public trust. The graffiti style works because the red warning marks make it feel unstable. Made with HeadlineHarmonies.",
      hashtags: ["#PoliticalArt", "#ForeignPolicy", "#Diplomacy"],
      altText:
        "A graffiti-style political scene with military imagery, warning marks, and rough wall texture.",
      suggestedFirstComment: "What do you think?",
    }),
  });
  const captionPackage = await buildVisionCaptionPackage(mockedImageInput, {
    openaiClient: mock.client,
    modelCandidates: ["test-vision"],
    cache: new Map(),
  });

  assert.equal(captionPackage.usedFallback, false);
  assert.doesNotMatch(captionPackage.caption, /political power|public trust/i);
  assert.equal(captionPackage.suggestedFirstComment, "The missiles are doing a lot here.");
});

test("vision caption package rewrites reporty live-model prose from structured fields", async () => {
  const mock = createMockCaptionClient({
    content: JSON.stringify({
      headlineTension:
        "The headline is about markets reacting to a military threat being pulled back.",
      visibleDetails: ["green bull", "splattered oil barrel"],
      styleFit:
        "The graffiti style works because the green bull and splattered oil barrel make the economic swing feel loud and public.",
      caption:
        "This image shows the clash between soaring stock markets and tumbling oil prices as military strikes are called off. The graffiti style’s vivid green bull and splattered oil barrel highlight the sharp economic and geopolitical shifts. Made with HeadlineHarmonies.",
      hashtags: ["#StockMarket", "#OilPrices", "#Geopolitics", "#GraffitiArt", "#VisualJournalism"],
      altText:
        "A graffiti-style image with a green bull and a splattered oil barrel.",
      suggestedFirstComment:
        "The green bull and spilled oil show the sharp rise in stocks and fall in oil prices after the strike cancellation.",
    }),
  });
  const captionPackage = await buildVisionCaptionPackage(mockedImageInput, {
    openaiClient: mock.client,
    modelCandidates: ["test-vision"],
    cache: new Map(),
  });

  assert.equal(captionPackage.usedFallback, false);
  assert.doesNotMatch(captionPackage.caption, /This image shows|highlight/i);
  assert.match(captionPackage.caption, /green bull|splattered oil barrel/i);
  assert.match(captionPackage.caption, /Made with HeadlineHarmonies\./);
  assert.equal(captionPackage.suggestedFirstComment, "The green bull is doing a lot here.");
});

test("vision caption package avoids headline contradictions from live model output", async () => {
  const mock = createMockCaptionClient({
    content: JSON.stringify({
      headlineTension:
        "Market crashes and geopolitical drama collide after military strikes are called off.",
      visibleDetails: ["Red downward arrow with jagged edges", "explosive background"],
      styleFit:
        "The graffiti style works because the red downward arrow with jagged edges and explosive background make the market reaction feel loud and public.",
      caption:
        "Market crashes and geopolitical drama collide in this gritty graffiti scene. The explosive background and sharp lines reflect the chaos. Made with HeadlineHarmonies.",
      hashtags: ["#GraffitiArt", "#MarketCrash", "#GeoPolitics", "#StreetArt", "#CurrentEvents"],
      altText:
        "A graffiti-style image with a red downward arrow, jagged edges, and an explosive background.",
      suggestedFirstComment:
        "The Red downward arrow with jagged edges are doing a lot here.",
    }),
  });
  const captionPackage = await buildVisionCaptionPackage({
    ...mockedImageInput,
    headline: marketIranHeadline,
  }, {
    openaiClient: mock.client,
    modelCandidates: ["test-vision"],
    cache: new Map(),
  });

  assert.equal(captionPackage.usedFallback, false);
  assert.doesNotMatch(captionPackage.caption, /market crashes|MarketCrash/i);
  assert.doesNotMatch(captionPackage.hashtags.join(" "), /MarketCrash/i);
  assert.match(captionPackage.caption, /brinkmanship|military threat|diplomatic talks|red downward arrow|explosive background/i);
  assert.equal(captionPackage.suggestedFirstComment, "The red downward arrow with jagged edges is doing a lot here.");
});

test("vision caption package rejects generic art traits and hype from live output", async () => {
  const mock = createMockCaptionClient({
    content: JSON.stringify({
      headlineTension:
        "Market chaos and geopolitical tension collide after military strikes are called off.",
      visibleDetails: ["bold lines", "chaotic energy"],
      styleFit:
        "Graffiti art's bold lines and chaotic energy perfectly match the headline's tension and dramatic scene.",
      caption:
        "Market chaos and geopolitical tension collide in a graffiti style. Graffiti art's bold lines and chaotic energy perfectly match the headline's tension and dramatic scene. Made with HeadlineHarmonies.",
      hashtags: ["#graffitiart", "#marketnews", "#geopolitics", "#urbanart", "#drama"],
      altText:
        "A graffiti-style image with bold lines and chaotic energy.",
      suggestedFirstComment:
        "This graffiti captures the chaos of the market and world tensions perfectly!",
    }),
  });
  const captionPackage = await buildVisionCaptionPackage({
    ...mockedImageInput,
    headline: marketIranHeadline,
  }, {
    openaiClient: mock.client,
    modelCandidates: ["test-vision"],
    cache: new Map(),
  });

  assert.equal(captionPackage.usedFallback, true);
  assert.doesNotMatch(captionPackage.caption, /perfectly|chaotic energy|dramatic scene|market chaos/i);
  assert.doesNotMatch(captionPackage.suggestedFirstComment, /perfectly|captures the chaos|world tensions/i);
});

test("vision caption package appends attribution and keeps suggested comment separate", async () => {
  const mock = createMockCaptionClient({
    content: JSON.stringify({
      headlineTension:
        "The headline is about force and negotiation happening at the same time.",
      visibleDetails: ["warning marks", "rough wall texture", "military imagery"],
      styleFit:
        "The graffiti style works because the warning marks and rough wall texture make the diplomacy feel unstable.",
      caption:
        "The headline is about force and negotiation happening at the same time. The graffiti style works because the warning marks and rough wall texture make the diplomacy feel unstable.",
      hashtags: ["#PoliticalArt", "#ForeignPolicy", "#Diplomacy"],
      altText:
        "A graffiti-style political scene with military imagery, warning marks, and rough wall texture.",
      suggestedFirstComment: "The warning marks are doing a lot here.",
    }),
  });
  const captionPackage = await buildVisionCaptionPackage(mockedImageInput, {
    openaiClient: mock.client,
    modelCandidates: ["test-vision"],
    cache: new Map(),
  });
  const shareText = formatCaptionPackageForShare(captionPackage);

  assert.match(captionPackage.caption, /Made with HeadlineHarmonies\.$/);
  assert.equal(shareText.includes(captionPackage.suggestedFirstComment), false);
});

test("post UI displays read-only copy blocks without changing share text", () => {
  assert.match(componentSource, /Suggested first comment/);
  assert.match(componentSource, /captionPackage\?\.suggestedFirstComment/);
  assert.match(componentSource, /Copy Suggested Comment/);
  assert.match(componentSource, /aria-label="Generated caption"/);
  assert.match(componentSource, /aria-label="Suggested first comment text"/);
  assert.match(componentSource, /text: caption/);
  assert.doesNotMatch(componentSource, /<Textarea/);
  assert.doesNotMatch(componentSource, /onChange=\{\(event\) => setCaption/);
  assert.doesNotMatch(componentSource, /Post directly from your browser/);
  assert.doesNotMatch(componentSource, /Generate an image first, then post to Instagram/);
});

test("post UI uses server caption packages without exposing OpenAI settings client-side", () => {
  assert.match(componentSource, /data\.captionPackage/);
  assert.match(componentSource, /isCaptionPackage\(data\.captionPackage\)/);
  assert.doesNotMatch(componentSource, /OPENAI_API_KEY|OPENAI_CAPTION_MODEL|process\.env|apiKey/);
  assert.match(generateImageSource, /OPENAI_CAPTION_MODEL/);
  assert.match(generateImageSource, /buildVisionCaptionPackage/);
  assert.match(visionCaptionSource, /response_format/);
  assert.match(visionCaptionSource, /json_object/);
});

test("generate step avoids grandiose metadata-style preview copy", () => {
  assert.doesNotMatch(componentSource, /An interpretation of/);
  assert.doesNotMatch(componentSource, /artistic masterpiece/);
  assert.doesNotMatch(componentSource, /echoes the pulse of contemporary life/);
  assert.match(componentSource, /Ready to turn/);
});

test("attributes and scoring are removed from UI and image API", () => {
  assert.doesNotMatch(componentSource, /Attributes:/);
  assert.doesNotMatch(componentSource, /Global Impact|Longevity|Cultural Significance|Media Coverage/);
  assert.doesNotMatch(generateImageSource, /chat\.completions|gpt-4o-mini|globalImpact|mediaCoverage|ENABLE_OPENAI_SCORING/);
  assert.doesNotMatch(generateImageSource, /scores|price/);
  assert.match(generateImageSource, /imageMimeType/);
});

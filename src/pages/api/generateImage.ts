/* eslint-disable prefer-const */
import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from "openai";

interface Scores {
  globalImpact: number;
  longevity: number;
  culturalSignificance: number;
  mediaCoverage: number;
}

let scores: Scores = {
    globalImpact: 0,
    longevity: 0,
    culturalSignificance: 0,
    mediaCoverage: 0
};

let price = 0;

const DEFAULT_OPENAI_IMAGE_MODEL = 'gpt-image-2';
const DEFAULT_OPENAI_IMAGE_SIZE = '1024x1024';
const DEFAULT_OPENAI_IMAGE_QUALITY = 'low';
const DEFAULT_OPENAI_IMAGE_FORMAT = 'jpeg';
const DEFAULT_OPENAI_IMAGE_COMPRESSION = 85;
const SCORE_KEYS: Array<keyof Scores> = ['globalImpact', 'longevity', 'culturalSignificance', 'mediaCoverage'];
const DISALLOWED_SCORE_FLOORS = new Set([0.21, 0.51, 0.81]);

function parseJsonObject(text: string): Record<string, unknown> | null {
    if (!text) return null;

    const trimmed = text.trim();
    const candidates = [trimmed];
    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fencedMatch?.[1]) {
        candidates.push(fencedMatch[1].trim());
    }

    for (const candidate of candidates) {
        try {
            const parsed = JSON.parse(candidate);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed as Record<string, unknown>;
            }
        } catch {
            // Try next candidate.
        }
    }

    return null;
}

function normalizeScore(value: unknown): number | null {
    const raw = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(raw)) return null;

    // If model returns 21 instead of 0.21, normalize to decimal.
    const normalized = raw > 1 && raw <= 99 ? raw / 100 : raw;
    if (normalized < 0.01 || normalized > 0.99) return null;

    return Number(normalized.toFixed(2));
}

function parseScoresFromJson(responseText: string): Scores | null {
    const obj = parseJsonObject(responseText);
    if (!obj) return null;

    const parsed: Partial<Scores> = {};
    for (const key of SCORE_KEYS) {
        const normalized = normalizeScore(obj[key]);
        if (normalized === null) return null;
        parsed[key] = normalized;
    }

    return parsed as Scores;
}

function validateScores(candidate: Scores): { valid: boolean; reason?: string } {
    const values = SCORE_KEYS.map((k) => Number(candidate[k].toFixed(2)));
    const unique = new Set(values.map((v) => v.toFixed(2)));

    if (unique.size !== values.length) {
        return { valid: false, reason: 'Scores must be unique across all categories' };
    }

    if (values.some((value) => DISALLOWED_SCORE_FLOORS.has(value))) {
        return { valid: false, reason: 'Scores used bucket floor values (0.21 / 0.51 / 0.81)' };
    }

    return { valid: true };
}

function buildFallbackScores(headline: string): Scores {
    // Deterministic unique fallback to avoid identical 0.25 values if upstream scoring is unavailable.
    const seed = headline.split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 100000, 7);
    const base = [0.23, 0.37, 0.49, 0.63];
    const jitter = [((seed % 7) - 3) * 0.01, ((seed % 11) - 5) * 0.005, ((seed % 13) - 6) * 0.005, ((seed % 17) - 8) * 0.005];

    const values = base.map((b, i) => Number(Math.min(0.99, Math.max(0.01, b + jitter[i])).toFixed(2)));
    const [globalImpact, longevity, culturalSignificance, mediaCoverage] = values;

    return { globalImpact, longevity, culturalSignificance, mediaCoverage };
}

const calculateAndSetAveragePrice = (scores: Scores) => {
const { globalImpact, longevity, culturalSignificance, mediaCoverage } = scores;
const average = (globalImpact + longevity + culturalSignificance + mediaCoverage) / 4;
const finalPrice = average;

// Set the average as the new price
return finalPrice;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).end('Method Not Allowed');
    }

    const { selectedStyle, selectedHeadline } = req.body;
    if (!selectedStyle || !selectedHeadline) {
        return res.status(400).json({ error: 'Missing required fields: selectedStyle or selectedHeadline' });
    }

    console.log("style: " + selectedStyle);
    console.log("headline: " + selectedHeadline);

        const openAiApiKey = process.env.OPENAI_API_KEY?.trim();
        const shouldUseOpenAiScoring =
            process.env.ENABLE_OPENAI_SCORING !== 'false' && !!openAiApiKey;
        const openai = shouldUseOpenAiScoring && openAiApiKey
            ? new OpenAI({ apiKey: openAiApiKey })
            : null;

        // Headline scoring is optional. If OpenAI is disabled/unavailable, continue with conservative defaults.
        scores = { globalImpact: 0, longevity: 0, culturalSignificance: 0, mediaCoverage: 0 };
        price = 0;
        if (openai) {
            const maxAttempts = 3;
            let validationError = '';
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    const completion = await openai.chat.completions.create({
                        model: "gpt-4o-mini",
                        temperature: 0.6,
                        response_format: { type: 'json_object' },
                        messages: [
                            {
                                role: "system",
                                content:
                                    `You score news headlines for an art app.
Return ONLY JSON (no markdown, no prose) with this exact shape:
{"globalImpact":number,"longevity":number,"culturalSignificance":number,"mediaCoverage":number}

Rules:
- Each score must be a unique decimal from 0.01 to 0.99.
- Keep two decimal places.
- Avoid bucket-floor values 0.21, 0.51, and 0.81.
- Do not repeat values across categories.
- Use the full range naturally based on the headline.`
                            },
                            {
                                role: "user",
                                content: `Headline: "${selectedHeadline || "No headline provided"}"${validationError ? `\nFix the prior issue: ${validationError}` : ''}`
                            }
                        ]
                    });

                    const openAiResponse = completion.choices?.[0]?.message?.content ?? "";
                    const parsedScores = parseScoresFromJson(openAiResponse);
                    if (!parsedScores) {
                        validationError = 'Output was not valid JSON with the required score fields.';
                        console.warn('OpenAI scoring parse failed. Raw response:', openAiResponse);
                    } else {
                        const validation = validateScores(parsedScores);
                        if (!validation.valid) {
                            validationError = validation.reason || 'Invalid score shape';
                            console.warn('OpenAI scoring validation failed:', validationError, parsedScores);
                        } else {
                            scores = parsedScores;
                            price = calculateAndSetAveragePrice(scores);
                            console.log("openai scores:", scores, "price:", price);
                            break;
                        }
                    }
                } catch (err: unknown) {
                    const e = err as { status?: number; code?: string; error?: { code?: string; message?: string } };
                    const status = e?.status;
                    const code = e?.error?.code || e?.code;
                    const message = (e as any)?.message || e?.error?.message || "OpenAI error";
                    console.error("OpenAI scoring error:", { status, code, message });

                    // If auth/quota/model is bad, do not retry and continue with fallback scores.
                    if (status === 401 || status === 404 || status === 429 || code === "insufficient_quota") {
                        break;
                    }
                }
                if (attempt < maxAttempts) {
                    await new Promise((r) => setTimeout(r, 300 * attempt));
                }
            }
        } else {
            console.log("Skipping OpenAI headline scoring (missing OPENAI_API_KEY or ENABLE_OPENAI_SCORING=false).");
        }

        // If still zeroed after attempts, set a conservative default so UI can proceed.
        if (price === 0 || Object.values(scores).some((s) => s === 0)) {
            scores = buildFallbackScores(selectedHeadline);
            price = calculateAndSetAveragePrice(scores);
            console.warn("Using fallback scores due to parsing/availability issues.");
        }

    const prompts = [
        `Craft a masterpiece, channeling the aesthetic essence of ${selectedStyle}, to convey the message behind the headline: "${selectedHeadline}"`,
        `Design an exquisite piece, drawing inspiration from the visual language of ${selectedStyle}, to interpret the narrative within the headline: "${selectedHeadline}"`,
        `Produce an artistic marvel, embracing the stylistic elements of ${selectedStyle}, to articulate the story encapsulated in the headline: "${selectedHeadline}"`,
        `Create a visual symphony, echoing the design ethos of ${selectedStyle}, to mirror the essence of the headline: "${selectedHeadline}"`,
        `Fashion a captivating artwork, embodying the visual characteristics of ${selectedStyle}, to depict the essence of the headline: "${selectedHeadline}"`,
        `Construct a striking composition, influenced by the aesthetic principles of ${selectedStyle}, to illuminate the essence of the headline: "${selectedHeadline}"`,
        `Shape an evocative piece, drawing from the visual motifs of ${selectedStyle}, to encapsulate the essence of the headline: "${selectedHeadline}"`,
        `Devise a stunning creation, inspired by the visual aesthetics of ${selectedStyle}, to reflect the narrative conveyed in the headline: "${selectedHeadline}"`,
        `Forge an artistic interpretation, mirroring the visual cues of ${selectedStyle}, to convey the underlying message of the headline: "${selectedHeadline}"`,
        `Sculpt an expressive artwork, embodying the stylistic nuances of ${selectedStyle}, to capture the essence of the headline: "${selectedHeadline}"`
    ];
    const noTextInstruction = "Do not include any text, captions, lettering, readable words, logos, or watermarks in the image.";

    // Choose a random prompt for variation or cycle through them in some manner
    const currentPrompt = `${prompts[Math.floor(Math.random() * prompts.length)]}. ${noTextInstruction}`;

    const openAiImageApiKey = process.env.OPENAI_IMAGE_API_KEY?.trim() || openAiApiKey;
    const imageModel = process.env.OPENAI_IMAGE_MODEL?.trim() || DEFAULT_OPENAI_IMAGE_MODEL;
    const imageSize = process.env.OPENAI_IMAGE_SIZE?.trim() || DEFAULT_OPENAI_IMAGE_SIZE;
    const imageQuality = process.env.OPENAI_IMAGE_QUALITY?.trim() || DEFAULT_OPENAI_IMAGE_QUALITY;
    const imageFormat = process.env.OPENAI_IMAGE_FORMAT?.trim() || DEFAULT_OPENAI_IMAGE_FORMAT;
    const imageCompression = Number(process.env.OPENAI_IMAGE_COMPRESSION || DEFAULT_OPENAI_IMAGE_COMPRESSION);
    const imageMimeType = `image/${imageFormat === 'jpg' ? 'jpeg' : imageFormat}`;

    if (!openAiImageApiKey) {
        console.error('OpenAI image API key is not configured.');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        console.log('Making OpenAI image API call with prompt:', currentPrompt);
        console.log('OpenAI image options:', { imageModel, imageSize, imageQuality, imageFormat });
        const openaiImages = new OpenAI({ apiKey: openAiImageApiKey });
        const imageResponse = await openaiImages.images.generate({
            model: imageModel,
            prompt: currentPrompt,
            n: 1,
            size: imageSize,
            quality: imageQuality,
            output_format: imageFormat,
            output_compression: imageCompression
        } as any);

        const base64Image = imageResponse.data?.[0]?.b64_json;

        if (!base64Image) {
            console.error('OpenAI image API response did not include base64 image data.');
            return res.status(502).json({ error: 'OpenAI image generation returned no image data' });
        }

        console.log('OpenAI image generation complete');
        res.status(200).json({ image: base64Image, imageMimeType, scores, price });
        } catch (error) {
            console.error('Error generating image:', error);
            // Use a type guard to check if 'error' is an instance of Error
            if (error instanceof Error) {
                res.status(500).json({ error: 'Error generating image: ' + error.message });
            } else {
                res.status(500).json({ error: 'An unknown error occurred' });
            }
  }
}

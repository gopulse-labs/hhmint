/* eslint-disable prefer-const */
import { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
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

const DEFAULT_HF_IMAGE_MODEL = 'black-forest-labs/FLUX.1-schnell';
const DEFAULT_HF_API_ENDPOINT = `https://router.huggingface.co/hf-inference/models/${DEFAULT_HF_IMAGE_MODEL}`;
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

        const shouldUseOpenAiScoring =
            process.env.ENABLE_OPENAI_SCORING !== 'false' && !!process.env.OPENAI_API_KEY;
        const openai = shouldUseOpenAiScoring && process.env.OPENAI_API_KEY
            ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
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

    // Choose a random prompt for variation or cycle through them in some manner
    const currentPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    let hfApiEndpoint = process.env.HF_API_ENDPOINT?.trim() || DEFAULT_HF_API_ENDPOINT;
    const hfApiKey = process.env.HF_API;

    // Backward-compat: rewrite old deprecated endpoint at runtime if present
    if (hfApiEndpoint && hfApiEndpoint.includes('api-inference.huggingface.co')) {
        hfApiEndpoint = hfApiEndpoint.replace('https://api-inference.huggingface.co/', 'https://router.huggingface.co/hf-inference/');
        console.log('Rewrote HF endpoint to Inference Providers router:', hfApiEndpoint);
    }

    // Backward-compat: auto-upgrade known deprecated image model.
    if (hfApiEndpoint.includes('/models/stabilityai/stable-diffusion-xl-base-1.0')) {
        console.warn('Configured Hugging Face model is deprecated. Switching to:', DEFAULT_HF_IMAGE_MODEL);
        hfApiEndpoint = DEFAULT_HF_API_ENDPOINT;
    }

    // Avoid logging secrets
    console.log(`Hugging Face API Endpoint: ${hfApiEndpoint}`);

    if (!hfApiEndpoint || !hfApiKey) {
        console.error('Hugging Face API endpoint or key is not configured.');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        console.log('Making API call to Hugging Face with prompt:', currentPrompt);
        const response = await fetch(hfApiEndpoint, {
           method: 'POST',
           headers: {
               'Authorization': `${hfApiKey}`,
               'Content-Type': 'application/json'
           },
           body: JSON.stringify({ inputs: currentPrompt })
        });
        console.log('API call complete, response status:', response.status);
        
        if (!response.ok) {
           const errorBody = await response.text();  // Use text first to avoid JSON parse errors
           console.log('API call failed, response body:', errorBody);

           const isDeprecatedModel =
               response.status === 410 &&
               /deprecated/i.test(errorBody) &&
               /no longer supported/i.test(errorBody);

           if (isDeprecatedModel) {
               console.warn('Hugging Face model is deprecated:', hfApiEndpoint);
               return res.status(410).json({
                   error: 'Configured Hugging Face model is deprecated',
                   details: errorBody,
                   suggestedModel: DEFAULT_HF_IMAGE_MODEL
               });
           }

           if (response.status === 429) {
               return res.status(429).json({ error: 'Hugging Face rate limit exceeded' });
           }
           return res.status(response.status).json({ error: 'Hugging Face error', details: errorBody });
        }

        const buffer = await response.arrayBuffer();
        console.log('Response buffer received, size:', buffer.byteLength);
        const base64Image = Buffer.from(buffer).toString('base64');
        console.log('Image converted to Base64');
    res.status(200).json({ image: base64Image, scores, price });
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

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

function extractScores(responseText: string): Scores {
    const regexPatterns = {
        globalImpact: /Global Impact:\s*(\d+\.\d+)/,
        longevity: /Longevity:\s*(\d+\.\d+)/,
        culturalSignificance: /Cultural Significance:\s*(\d+\.\d+)/,
        mediaCoverage: /Media Coverage:\s*(\d+\.\d+)/
    };

  

    // Iterate over each score type and attempt to find matches
    for (const [key, regex] of Object.entries(regexPatterns)) {
        const match = responseText.match(regex);
        if (match && match[1]) {
            scores[key as keyof Scores] = parseFloat(match[1]);  // Safely indexing using keyof Scores
        } else {
            console.error(`No match found for ${key}.`);
        }
    }

    return scores;
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

        // Initialize OpenAI server-side; let SDK read OPENAI_API_KEY from env if not explicitly provided.
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        // Ask OpenAI to score the headline, with bounded retries and backoff to avoid spamming on errors.
        scores = { globalImpact: 0, longevity: 0, culturalSignificance: 0, mediaCoverage: 0 };
        price = 0;
        const maxAttempts = 2;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content:
                                `Please provide a detailed analysis of the following news headline. Each category should be scored on a precise scale from 0.01 to 0.99.
Scoring Guidelines:
Global Impact: 0.01-0.2 (local), 0.21-0.5 (national), 0.51-0.8 (international), 0.81-1 (worldwide)
Longevity: 0.01-0.2 (days-weeks), 0.21-0.5 (months-years), 0.51-0.8 (decades), 0.81-1 (permanent)
Cultural Significance: 0.01-0.2 (niche), 0.21-0.5 (regional), 0.51-0.8 (multi-country), 0.81-1 (global culture/history)
Media Coverage: 0.01-0.2 (limited), 0.21-0.5 (moderate), 0.51-0.8 (extensive), 0.81-1 (intense)`
                        },
                        { role: "user", content: selectedHeadline || "No headline provided" }
                    ]
                });

                const openAiResponse = completion.choices?.[0]?.message?.content ?? "";
                scores = extractScores(openAiResponse);
                price = calculateAndSetAveragePrice(scores);
                console.log("openai scores:", scores, "price:", price);
                // If we parsed non-zero values, stop trying.
                if (price > 0 && Object.values(scores).every((s) => s > 0)) break;
            } catch (err: unknown) {
                // Normalize known OpenAI errors
                const e = err as { status?: number; code?: string; error?: { code?: string; message?: string } };
                const status = e?.status;
                const code = e?.error?.code || e?.code;
                const message = (e as any)?.message || e?.error?.message || "OpenAI error";
                console.error("OpenAI error:", { status, code, message });
                if (status === 429 || code === "insufficient_quota") {
                    return res.status(429).json({ error: "OpenAI rate limit/quota exceeded" });
                }
                if (status === 401) {
                    return res.status(401).json({ error: "Invalid OpenAI API key or unauthorized" });
                }
                if (status === 404) {
                    return res.status(404).json({ error: "Requested OpenAI model not available" });
                }
                // Other server errors
                if (status && status >= 500) {
                    return res.status(502).json({ error: "Upstream OpenAI error" });
                }
                // For non-status errors, try next attempt with small backoff; if last attempt, fall back.
            }
            if (attempt < maxAttempts) {
                await new Promise((r) => setTimeout(r, 300 * attempt));
            }
        }
        // If still zeroed after attempts, set a conservative default so UI can proceed.
        if (price === 0 || Object.values(scores).some((s) => s === 0)) {
            scores = { globalImpact: 0.25, longevity: 0.25, culturalSignificance: 0.25, mediaCoverage: 0.25 };
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

    let hfApiEndpoint = process.env.HF_API_ENDPOINT;
    const hfApiKey = process.env.HF_API;

    // Backward-compat: rewrite old deprecated endpoint at runtime if present
    if (hfApiEndpoint && hfApiEndpoint.includes('api-inference.huggingface.co')) {
        hfApiEndpoint = hfApiEndpoint.replace('https://api-inference.huggingface.co/', 'https://router.huggingface.co/hf-inference/');
        console.log('Rewrote HF endpoint to Inference Providers router:', hfApiEndpoint);
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
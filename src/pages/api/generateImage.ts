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

function extractScores(responseText: string): Scores {
const regexPatterns = {
    globalImpact: /Global Impact:\s*(\d+\.\d+)/,
    longevity: /Longevity:\s*(\d+\.\d+)/,
    culturalSignificance: /Cultural Significance:\s*(\d+\.\d+)/,
    mediaCoverage: /Media Coverage:\s*(\d+\.\d+)/
};

let scores: Scores = {
    globalImpact: 0,
    longevity: 0,
    culturalSignificance: 0,
    mediaCoverage: 0
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
const finalPrice = average * 10;

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

    const openai = new OpenAI({
      apiKey: process.env.openAI, 
      dangerouslyAllowBrowser: true });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
          { role: "system", content: `Please provide a detailed analysis of the following news headline. Each category should be scored on a precise scale from 
            0.01 to 0.99, reflecting subtle differences in impact and significance based on the event's details and implications. Ensure that each score 
            truly captures the gradation of impact, significance, and anticipated coverage, avoiding rounding to general values unless absolutely fitting. Evaluate 
            each aspect carefully and justify each score with specific reasons drawn from the event's characteristics.”

          Scoring Guidelines:

            •	Global Impact: Score from 0.01 to 0.99, where 0.01 represents minimal impact and 0.99 indicates a profound global effect.
            Consider factors like international relations, global markets, and worldwide public health.
            •	Longevity: Score from 0.01 to 0.99, assessing how long the effects of the event will last. A score closer to 
            0.01 suggests transient effects, whereas 0.99 suggests changes or consequences enduring over generations.
            •	Cultural Significance: Evaluate how deeply the event influences cultural values, societal norms, and artistic
            expressions across different regions, scoring minutely to reflect the extent and depth of cultural penetration.
            •	Media Coverage: Assign a score based on the extent, depth, and duration of anticipated media attention across the globe.
            Detailed considerations should include the diversity of reporting sources, the sustained interest over time, and the intensity of the coverage.` },
          {
              role: "user",
              content: selectedHeadline || "No headline provided",
          },
      ],
  });

  const openAiResponse = completion.choices[0].message.content || "";
const scores = extractScores(openAiResponse);
const price = calculateAndSetAveragePrice(scores);

console.log("openai: " + scores, price)

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

    const hfApiEndpoint = process.env.HF_API_ENDPOINT;
    const hfApiKey = process.env.HF_API;

    console.log(`Hugging Face API Key: ${hfApiKey}`);
    console.log(`Hugging Face API Endpoint: ${hfApiEndpoint}`);

    if (!hfApiEndpoint || !hfApiKey) {
        console.error('Hugging Face API endpoint or key is not configured.');
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
      const response = await fetch(hfApiEndpoint, {
          method: 'POST',
          headers: {
              'Authorization': `${hfApiKey}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ inputs: currentPrompt })
      });
  
      if (!response.ok) {
        const errorBody = await response.json(); // Assuming the server sends back a JSON error message
        console.error('Error generating image:', errorBody);
        throw new Error(`HTTP error! Status: ${response.status}, ${errorBody.error}`);
      }

      const buffer = await response.arrayBuffer();
      const base64Image = Buffer.from(buffer).toString('base64');
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
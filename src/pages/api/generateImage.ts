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

    const openai = new OpenAI({
      apiKey: process.env.openAI, 
      dangerouslyAllowBrowser: true });

      

      do   {

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
          { role: "system", content: `Please provide a detailed analysis of the following news headline. Each category should be scored on a precise scale from 
            0.01 to 0.99, reflecting subtle differences in impact and significance based on the headline's details and implications. Ensure that each score 
            truly captures the gradation of impact, significance, and anticipated coverage, avoiding rounding to general values unless absolutely fitting. Evaluate 
            each aspect carefully and justify each score with specific reasons drawn from the event's characteristics.”

          Scoring Guidelines:
            Global Impact:

            0.01 to 0.2: Minor local interest (e.g., local events, minor news).
            0.21 to 0.5: Significant national interest (e.g., national sports events, national political news).
            0.51 to 0.8: Major international interest (e.g., international sporting events, significant political events in large countries).
            0.81 to 1: Worldwide impact (e.g., global pandemics, world wars, major scientific breakthroughs).
            Longevity:

            0.01 to 0.2: Short-term interest (days to weeks).
            0.21 to 0.5: Medium-term interest (months to a few years).
            0.51 to 0.8: Long-term interest (decades).
            0.81 to 1: Permanent impact (centuries or more).
            Cultural Significance:

            0.01 to 0.2: Minor or niche cultural impact.
            0.21 to 0.5: Significant cultural impact within a country or region.
            0.51 to 0.8: Major cultural impact affecting multiple countries or regions.
            0.81 to 1: Profound cultural impact, leading to major changes in global culture or history.
            Media Coverage:

            0.01 to 0.2: Limited media coverage.
            0.21 to 0.5: Moderate media coverage in a few countries.
            0.51 to 0.8: Extensive media coverage in many countries.
            0.81 to 1: Intense media coverage globally.` },
          {
              role: "user",
              content: selectedHeadline || "No headline provided",
          },
      ],
  });

  const openAiResponse = completion.choices[0].message.content || "";
  scores = extractScores(openAiResponse);
  price = calculateAndSetAveragePrice(scores);

  console.log("openai: " + JSON.stringify(scores), price);

}

  while (price === 0 && Object.values(scores).some(score => score === 0));

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
           throw new Error(`HTTP error! Status: ${response.status}, Body: ${errorBody}`);
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
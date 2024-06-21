import { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end(); // Method Not Allowed
  }

  const { selectedStyle, selectedHeadline } = req.body;
  const prompts = [
    "Craft a masterpiece, channeling the aesthetic essence of " + selectedStyle + ", to convey the message behind the headline: " + '"' + selectedHeadline + '"',
    "Design an exquisite piece, drawing inspiration from the visual language of " + selectedStyle + ", to interpret the narrative within the headline: " + '"' + selectedHeadline + '"',
    "Produce an artistic marvel, embracing the stylistic elements of " + selectedStyle + ", to articulate the story encapsulated in the headline: " + '"' + selectedHeadline + '"',
    "Create a visual symphony, echoing the design ethos of " + selectedStyle + ", to mirror the essence of the headline: " + '"' + selectedHeadline + '"',
    "Fashion a captivating artwork, embodying the visual characteristics of " + selectedStyle + ", to depict the essence of the headline: " + '"' + selectedHeadline + '"',
    "Construct a striking composition, influenced by the aesthetic principles of " + selectedStyle + ", to illuminate the essence of the headline: " + '"' + selectedHeadline + '"',
    "Shape an evocative piece, drawing from the visual motifs of " + selectedStyle + ", to encapsulate the essence of the headline: " + '"' + selectedHeadline + '"',
    "Devise a stunning creation, inspired by the visual aesthetics of " + selectedStyle + ", to reflect the narrative conveyed in the headline: " + '"' + selectedHeadline + '"',
    "Forge an artistic interpretation, mirroring the visual cues of " + selectedStyle + ", to convey the underlying message of the headline: " + '"' + selectedHeadline + '"',
    "Sculpt an expressive artwork, embodying the stylistic nuances of " + selectedStyle + ", to capture the essence of the headline: " + '"' + selectedHeadline + '"'
  ];
  const currentPrompt = `${prompts[0]} ${selectedStyle}, to convey the message behind the headline: "${selectedHeadline}"`;

  const hfApi = process.env.HF_API_KEY; // Set in your environment variables
  const hfApiEndpoint = "https://api-inference.huggingface.co/models/prompthero/openjourney";

  try {
    const response = await fetch(hfApiEndpoint, {
      headers: { Authorization: `Bearer ${hfApi}` },
      method: "POST",
      body: JSON.stringify({ inputs: currentPrompt }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    res.status(200).json({ image: base64Image });
  } catch (error) {
    console.error('Error generating image:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.status(500).json({ error: 'Error generating image' });
  }
}
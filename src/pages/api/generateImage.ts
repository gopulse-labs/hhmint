import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from "openai";
import { buildVisionCaptionPackage } from '../../lib/visionCaptionPackage';

const DEFAULT_OPENAI_IMAGE_MODEL = 'gpt-image-2';
const DEFAULT_OPENAI_IMAGE_SIZE = '1024x1024';
const DEFAULT_OPENAI_IMAGE_QUALITY = 'low';
const DEFAULT_OPENAI_IMAGE_FORMAT = 'jpeg';
const DEFAULT_OPENAI_IMAGE_COMPRESSION = 85;

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

    const openAiImageApiKey = process.env.OPENAI_IMAGE_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
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
        const captionPackage = await buildVisionCaptionPackage({
            headline: selectedHeadline,
            style: selectedStyle,
            imageBase64: base64Image,
            imageMimeType,
            imagePrompt: currentPrompt,
            apiKey: process.env.OPENAI_API_KEY?.trim(),
            modelOverride: process.env.OPENAI_CAPTION_MODEL?.trim(),
        });

        res.status(200).json({ image: base64Image, imageMimeType, captionPackage });
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

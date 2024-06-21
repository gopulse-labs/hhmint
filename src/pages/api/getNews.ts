import { parseStringPromise } from 'xml2js';
import axios from 'axios';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const response = await axios.get('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en');
    const parsedNews = await parseStringPromise(response.data);
    const headlines = parsedNews.rss.channel[0].item.map((item: any) => {
      const titleElement = item.title[0];
      const originalHeadline = titleElement || titleElement.toString();
      const lastDashIndex = originalHeadline.lastIndexOf(' - ');
      return lastDashIndex !== -1 ? originalHeadline.substring(0, lastDashIndex) : originalHeadline;
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    res.status(200).json({ headlines });
  } catch (error) {
    console.error('Error fetching news:', error);
    console.error('Response data:', error.response?.data);
    console.error('Response status:', error.response?.status);
    console.error('Response headers:', error.response?.headers);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    res.status(500).send('Internal Server Error');
  }
}

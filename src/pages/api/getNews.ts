import axios from 'axios'; 
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const response = await axios.get('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en');
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).send('Internal Server Error');
  }
}

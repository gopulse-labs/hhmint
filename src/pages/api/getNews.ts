import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import parseString from 'xml2js'; // Import the necessary module for XML parsing

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const response = await axios.get('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en');
    const parsedNews = await parseString.parseStringPromise(response.data); // Parse XML response
    const numberOfTitles = parsedNews.rss.channel[0].item.length;
    let random = getRandomNumber(numberOfTitles);
    let titleElement = parsedNews.rss.channel[0].item[random].title;
    let originalHeadline = titleElement.textContent || titleElement.toString();
    let lastDashIndex = originalHeadline.lastIndexOf(' - ');
    let modifiedHeadline = originalHeadline.substring(0, lastDashIndex);
    res.json(modifiedHeadline); // Return the modified headline in the response
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).send('Internal Server Error');
  }
}

function getRandomNumber(itemCount: number): number {
  return Math.floor(Math.random() * itemCount);
}
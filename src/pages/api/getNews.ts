import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import parseString from 'xml2js'; // Import the necessary module for XML parsing

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await axios.get('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en');
    
    const parsedNews = await parseString.parseStringPromise(response.data);
    const numberOfTitles = parsedNews.rss.channel[0].item.length;
    let random = getRandomNumber(numberOfTitles);
    let titleElement = parsedNews.rss.channel[0].item[random].title;
    let originalHeadline = titleElement.textContent || titleElement.toString();
    let lastDashIndex = originalHeadline.lastIndexOf(' - ');
    let modifiedHeadline = originalHeadline.substring(0, lastDashIndex);
    res.json({headline: modifiedHeadline}); // Return the modified headline as a string
  } catch (error) {
    console.error('Error fetching news: ' + error);
    res.json({error: 'Internal Server Error'});
  }
}

function getRandomNumber(itemCount: number): number {
    return Math.floor(Math.random() * itemCount);
  }
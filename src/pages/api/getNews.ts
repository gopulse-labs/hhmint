import parseString from 'xml2js'; // Import the necessary module for XML parsing
import axios from 'axios';

export async function handler(event: any, context: any) {
  try {
    const response = await axios.get('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en');
    const parsedNews = await parseString.parseStringPromise(response.data);
    const numberOfTitles = parsedNews.rss.channel[0].item.length;
    let random = getRandomNumber(numberOfTitles);
    let titleElement = parsedNews.rss.channel[0].item[random].title;
    let originalHeadline = titleElement.textContent || titleElement.toString();
    let lastDashIndex = originalHeadline.lastIndexOf(' - ');
    let modifiedHeadline = originalHeadline.substring(0, lastDashIndex);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
      },
      body: JSON.stringify({ modifiedHeadline }), // Return the modified headline as JSON
    };
  } catch (error) {
    console.error('Error fetching news: ' + error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
      },
      body: 'Internal Server Error',
    };
  }
}

function getRandomNumber(itemCount: number): number {
    return Math.floor(Math.random() * itemCount);
  }
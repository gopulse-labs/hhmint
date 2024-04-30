import parseString from 'xml2js'; // Import the necessary module for XML parsing
import axios from 'axios';

export async function handler(event: any, context: any) {
  try {
    const response = await axios.get('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en');
    const parsedNews = await parseString.parseStringPromise(response.data);
    const headlines = parsedNews.rss.channel[0].item.map((item: { title: any; }) => {
      let titleElement = item.title;
      let originalHeadline = titleElement.textContent || titleElement.toString();
      let lastDashIndex = originalHeadline.lastIndexOf(' - ');
      return lastDashIndex !== -1 ? originalHeadline.substring(0, lastDashIndex) : originalHeadline;
    });

return {
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
  },
  body: JSON.stringify({ headlines }), // Return the array of headlines as JSON
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
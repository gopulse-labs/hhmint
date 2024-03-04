import axios from 'axios';
import { NextResponse } from 'next/server'
import parseString from 'xml2js'; // Import the necessary module for XML parsing

export default async function handler() {
  try {
    const response = await axios.get('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en');
    
    const parsedNews = await parseString.parseStringPromise(response.data);
    const numberOfTitles = parsedNews.rss.channel[0].item.length;
    let random = getRandomNumber(numberOfTitles);
    let titleElement = parsedNews.rss.channel[0].item[random].title;
    let originalHeadline = titleElement.textContent || titleElement.toString();
    let lastDashIndex = originalHeadline.lastIndexOf(' - ');
    let modifiedHeadline = originalHeadline.substring(0, lastDashIndex);
    return NextResponse.json({headline: modifiedHeadline}, { status: 200 }); // Return the modified headline as a string
  } catch (error) {
    console.error('Error fetching news: ' + error);
    
  }
}

function getRandomNumber(itemCount: number): number {
    return Math.floor(Math.random() * itemCount);
  }
import axios from 'axios'; // You can use Axios directly in Next.js API routes

export default async function handler(req: any, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: any): void; new(): any; }; send: { (arg0: string): void; new(): any; }; }; }) {
  try {
    const response = await axios.get('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en');
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).send('Internal Server Error');
  }
}

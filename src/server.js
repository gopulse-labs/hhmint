const express = require('express');
const axios = require('axios');
const app = express();
const port = 3001;
const cors = require('cors');

app.use(cors());

app.use(express.json());

app.get('/getNews', async (req, res) => {
  try {
    const response = await axios.get('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en');
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/getPrice', async (req, res) => {
  try {
    let { salesLastSixHours, salesPreviousSixHours } = req.query;
    let price = calculateNFTPrice(parseInt(salesLastSixHours), parseInt(salesPreviousSixHours));
    res.send(price);
  } catch (error) {
    console.error('Error fetching price:', error);
    res.status(500).send('Internal Server Error');
  }
});

function calculateNFTPrice(salesLastSixHours, salesPreviousSixHours) {
  let demandRatio = (1 + (0.1 * (salesLastSixHours - salesPreviousSixHours)));
  let minPrice = 1;
  let currentPrice = Math.max(minPrice, demandRatio);
  return currentPrice;
};

// app.get('/getHeadline', async (req, res) => {
//   try {
//     const response = await axios.get('https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en');
//     const parsedNews = await parseString.parseStringPromise(response.data);
//     const numberOfTitles = parsedNews.rss.channel[0].item.length;
//     let random = getRandomNumber(numberOfTitles);
//     console.log("Number of titles: ", numberOfTitles);
//     let titleElement = parsedNews.rss.channel[0].item[random].title;
//     let originalHeadline = titleElement.textContent || titleElement.toString();
//     console.log("original: " + originalHeadline, typeof originalHeadline)
//     let lastDashIndex = originalHeadline.lastIndexOf(' - ');
//     let modifiedHeadline = originalHeadline.substring(0, lastDashIndex);
//     console.log("modified: " + modifiedHeadline)
//     res.send(modifiedHeadline);
//   } catch (error) {
//     console.error('Error fetching headline:', error);
//     res.status(500).send('Internal Server Error');
//   }
// });

app.get('/generateImage', async (req, res) => {
  try {
    const data = { inputs: "Fashion a work of art, adopting the visual style of " + selectedStyle + 
          ", reflecting the theme of the headline: " + '"' + news + '"' };
    console.log(data.inputs);
    const response = await fetch(
      "https://api-inference.huggingface.co/models/prompthero/openjourney",
      {
        headers: { Authorization: "Bearer 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" },
        method: "POST",
        body: JSON.stringify(data),
      },
    
  )
  res.send(response)
} catch (error) {
    console.error('Error generating image:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

function getRandomNumber(itemCount) {
  return Math.floor(Math.random() * itemCount);
}
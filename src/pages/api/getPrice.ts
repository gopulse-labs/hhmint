import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  try {
    const { salesLastSixHours, salesPreviousSixHours } = req.query;
    const price = calculateNFTPrice(parseInt(salesLastSixHours as string), parseInt(salesPreviousSixHours as string));

    // Log the price
    console.log("Current price:", price);

    res.send(price.toString()); // Send price as plain text
  } catch (error) {
    console.error('Error fetching price:', error);
    res.status(500).send('Internal Server Error');
  }
}

function calculateNFTPrice(salesLastSixHours: number, salesPreviousSixHours: number) {
  // Validate input
  if (isNaN(salesLastSixHours) || isNaN(salesPreviousSixHours)) {
    throw new Error('Invalid input. Both salesLastSixHours and salesPreviousSixHours must be numbers.');
  }

  // Calculate demand ratio and current price
  let demandRatio = 1 + (0.1 * (salesLastSixHours - salesPreviousSixHours));
  let minPrice = 1;
  let currentPrice = Math.max(minPrice, demandRatio);

  // Convert to float and return
  return parseFloat(currentPrice.toFixed(2));
}
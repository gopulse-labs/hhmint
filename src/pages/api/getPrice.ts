export default function handler(req: { query: { salesLastSixHours: any; salesPreviousSixHours: any; }; }, 
  res: { status: (arg0: number) => { (): any; new(): any; send: { (arg0: string): void; new(): any; }; }; }) {
    try {
      const { salesLastSixHours, salesPreviousSixHours } = req.query;
      const price = calculateNFTPrice(parseInt(salesLastSixHours), parseInt(salesPreviousSixHours));
  
      // Log the price
      console.log("Current price:", price);
  
      res.status(200).send(price.toString()); // Send price as plain text
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
export async function handler(event: { queryStringParameters: { salesLastSixHours: any; salesPreviousSixHours: any; }; }, context: any) {
  try {
    const { salesLastSixHours, salesPreviousSixHours } = event.queryStringParameters;
    const price = calculateNFTPrice(parseInt(salesLastSixHours), parseInt(salesPreviousSixHours));

    // Log the price
    console.log("Current price: " + price);
    console.log("Current price string: " + price.toString());

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
      },
      body: price.toString(), // Send price as plain text
    };
  } catch (error) {
    console.error('Error fetching price: ' + error);
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
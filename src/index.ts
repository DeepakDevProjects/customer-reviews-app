// Lambda handler that fetches reviews for multiple products and saves HTML fragments to S3.
import { fetchProductReviews } from './reviewsFetcher';
import { renderProductReviewsHtml } from './reviewsRenderer';
import { saveReviewFragment } from './storage';

const API_BASE_URL = process.env.API_BASE_URL ?? 'https://api.example.com';
const PRODUCT_IDS = process.env.PRODUCT_IDS ?? 'product-a,product-b';
const OUTPUT_BUCKET = process.env.OUTPUT_BUCKET ?? 'customer-reviews-demo';

export const handler = async () => {
  try {
    const productIds = PRODUCT_IDS.split(',').map((id) => id.trim());
    const results = [];

    for (const productId of productIds) {
      console.log(`Processing product: ${productId}`);

      // Fetch reviews for this product
      const payload = await fetchProductReviews({
        apiBaseUrl: API_BASE_URL,
        productId,
      });

      // Render HTML fragment
      const html = renderProductReviewsHtml(payload);

      // Save to S3
      const key = `reviews/${productId}.html`;
      await saveReviewFragment({ bucket: OUTPUT_BUCKET, key, html });

      results.push({ productId, key, status: 'saved' });
      console.log(`Saved fragment: ${key}`);
    }

    const response = {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: `Successfully processed ${results.length} product(s)`,
        results,
      }),
    };
    
    // Log the response so it appears in CloudWatch Logs for EventBridge invocations
    console.log('Lambda execution completed successfullyyy:', JSON.stringify(response, null, 2));
    
    return response;
  } catch (error: any) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

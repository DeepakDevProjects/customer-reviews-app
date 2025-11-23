// Generates the main HTML page that uses ESI (Edge Side Includes) to compose multiple product review fragments.
// This page will be served by Fastly CDN, which will process the ESI tags and include the fragments from S3.

export interface MainPageOptions {
  productIds: string[];
  bucketName: string;
  bucketRegion?: string;
}

/**
 * Generates the main HTML page with ESI includes for product review fragments.
 * 
 * ESI (Edge Side Includes) is a markup language that allows CDNs like Fastly to
 * compose multiple HTML fragments into a single page at the edge (CDN level).
 * 
 * How it works:
 * 1. This main page is uploaded to S3
 * 2. Fastly CDN serves this page
 * 3. Fastly processes <esi:include> tags
 * 4. Fastly fetches each fragment from S3 and includes it in the final HTML
 * 5. User receives a fully composed page with all reviews
 * 
 * @param options - Configuration for the main page
 * @returns Complete HTML string with ESI includes
 */
export const renderMainPageWithEsi = (options: MainPageOptions): string => {
  const { productIds, bucketName, bucketRegion = 'us-east-1' } = options;
  
  // Construct S3 URLs for each product fragment
  // Format: https://{bucket}.s3.{region}.amazonaws.com/reviews/{productId}.html
  const s3BaseUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com`;
  
  // Generate ESI include tags for each product
  const esiIncludes = productIds
    .map(
      (productId) => `
    <!-- ESI include for ${productId} reviews -->
    <esi:include src="${s3BaseUrl}/reviews/${productId}.html" />
`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer Reviews - All Products</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .subtitle {
            margin-top: 10px;
            opacity: 0.9;
            font-size: 1.1em;
        }
        .reviews-container {
            display: grid;
            gap: 30px;
        }
        section {
            background: white;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0,0, 0.1);
        }
        section h2 {
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        article {
            border-left: 4px solid #667eea;
            padding: 15px;
            margin-bottom: 15px;
            background: #f9f9f9;
            border-radius: 4px;
        }
        article header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            background: none;
            padding: 0;
            box-shadow: none;
        }
        article strong {
            color: #333;
            font-size: 1.1em;
        }
        article time {
            color: #666;
            font-size: 0.9em;
        }
        footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #666;
            font-size: 0.9em;
        }
        .esi-fallback {
            color: #999;
            font-style: italic;
            padding: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <header>
        <h1>🌟 Customer Reviews</h1>
        <p class="subtitle">Real customer feedback for our products</p>
    </header>
    
    <main class="reviews-container">
        ${esiIncludes}
        
        <!-- Fallback message if ESI processing fails -->
        <esi:remove>
            <div class="esi-fallback">
                <p>Note: This page uses ESI (Edge Side Includes) to compose reviews from multiple sources.</p>
                <p>If you see this message, ESI processing may not be enabled in your CDN.</p>
            </div>
        </esi:remove>
    </main>
    
    <footer>
        <p>Last updated: <time id="last-update">Loading...</time></p>
        <p>Reviews are updated every 1 hour via AWS EventBridge and Lambda</p>
    </footer>
    
    <script>
        // Update last updated time
        document.getElementById('last-update').textContent = new Date().toLocaleString();
    </script>
</body>
</html>`;
};


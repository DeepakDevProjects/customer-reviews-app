// Lambda handler wrapper for the mock API that returns product review data.
// This converts API Gateway events into responses without needing Express.

type Review = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type MockDataEntry = {
  productId: string;
  productName: string;
  reviews: Review[];
};

const mockData: Record<string, MockDataEntry> = {
  'product-a': {
    productId: 'product-a',
    productName: 'Wireless Headphones',
    reviews: [
      { id: 'rev-a-10', author: 'Chaminda boss', rating: 5, comment: 'Lajawabbbb..', createdAt: '2025-11-20T10:30:00Z' },
      { id: 'rev-a-11', author: 'Barrmunda', rating: 5, comment: 'munda jabardast hai!', createdAt: '2025-11-20T10:30:00Z' },
      { id: 'rev-a-12', author: 'Alice Johnson', rating: 5, comment: 'Amazing sound quality!', createdAt: '2024-11-20T10:30:00Z' },
      { id: 'rev-a-2', author: 'Bob Smith', rating: 4, comment: 'Very comfortable, but a bit pricey.', createdAt: '2024-11-19T14:20:00Z' },
      { id: 'rev-a-3', author: 'Carol Lee', rating: 5, comment: 'Best headphones I ever bought.', createdAt: '2024-11-18T12:15:00Z' },
      { id: 'rev-a-4', author: 'David Chen', rating: 4, comment: 'Good battery life, noise cancellation works well.', createdAt: '2024-11-17T16:45:00Z' },
      { id: 'rev-a-5', author: 'Emma Davis', rating: 3, comment: 'Decent, but not as advertised.', createdAt: '2024-11-16T11:00:00Z' },
      { id: 'rev-a-6', author: 'Frank Wilson', rating: 5, comment: 'Superb build quality.', createdAt: '2024-11-15T13:30:00Z' },
      { id: 'rev-a-7', author: 'Grace Martinez', rating: 4, comment: 'Great for music lovers.', createdAt: '2024-11-14T10:20:00Z' },
      { id: 'rev-a-8', author: 'Henry Taylor', rating: 5, comment: 'Worth every penny!', createdAt: '2024-11-13T12:10:00Z' },
      { id: 'rev-a-9', author: 'Iris Brown', rating: 4, comment: 'Comfortable for long sessions.', createdAt: '2024-11-12T15:50:00Z' },
      { id: 'rev-a-10', author: 'Jack Moore', rating: 5, comment: 'Highly recommend!', createdAt: '2024-11-11T10:05:00Z' },
      { id: 'rev-a-11', author: 'Karen White', rating: 3, comment: 'Good but could be better.', createdAt: '2024-11-10T12:30:00Z' },
      { id: 'rev-a-12', author: 'Leo Harris', rating: 4, comment: 'Solid choice for the price.', createdAt: '2024-11-09T14:00:00Z' },
    ],
  },
  'product-b': {
    productId: 'product-b',
    productName: 'Smart Watch',
    reviews: [
      { id: 'rev-b-10', author: 'Rahat khan', rating: 5, comment: 'jillelahi!', createdAt: '2025-11-20T11:00:00Z' },
      { id: 'rev-b-1', author: 'Mia Clark', rating: 5, comment: 'Love the fitness tracking features!', createdAt: '2024-11-20T11:00:00Z' },
      { id: 'rev-b-2', author: 'Noah Lewis', rating: 4, comment: 'Great design, battery lasts long.', createdAt: '2024-11-19T13:45:00Z' },
      { id: 'rev-b-3', author: 'Olivia Walker', rating: 5, comment: 'Perfect for my daily workouts.', createdAt: '2024-11-18T10:30:00Z' },
      { id: 'rev-b-4', author: 'Paul Hall', rating: 4, comment: 'Accurate heart rate monitor.', createdAt: '2024-11-17T17:20:00Z' },
      { id: 'rev-b-5', author: 'Quinn Allen', rating: 3, comment: 'Good but syncing can be slow.', createdAt: '2024-11-16T10:15:00Z' },
      { id: 'rev-b-6', author: 'Rachel Young', rating: 5, comment: 'Stylish and functional.', createdAt: '2024-11-15T14:00:00Z' },
      { id: 'rev-b-7', author: 'Sam King', rating: 4, comment: 'Nice display, easy to read.', createdAt: '2024-11-14T10:50:00Z' },
      { id: 'rev-b-8', author: 'Tina Wright', rating: 5, comment: 'Best smartwatch I have owned!', createdAt: '2024-11-13T11:40:00Z' },
      { id: 'rev-b-9', author: 'Uma Scott', rating: 4, comment: 'Water resistant as promised.', createdAt: '2024-11-12T16:30:00Z' },
      { id: 'rev-b-10', author: 'Victor Green', rating: 5, comment: 'Excellent value for money.', createdAt: '2024-11-11T12:25:00Z' },
      { id: 'rev-b-11', author: 'Wendy Adams', rating: 3, comment: 'Works well, but app needs improvement.', createdAt: '2024-11-10T11:10:00Z' },
      { id: 'rev-b-12', author: 'Xander Baker', rating: 4, comment: 'Reliable and durable.', createdAt: '2024-11-09T13:20:00Z' },
    ],
  },
};

export const handler = async (event: any) => {
  console.log('Mock API Lambda received:', JSON.stringify(event, null, 2));

  // Extract product ID from path: /products/{productId}/reviews
  const path = event.path || event.rawPath || event.requestContext?.path || '';
  const match = path.match(/\/products\/([^\/]+)\/reviews/);

  // Handle root path
  if (path === '/' || path === '') {
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ 
        message: 'Customer Reviews Mock API',
        endpoints: [
          '/products/product-a/reviews',
          '/products/product-b/reviews'
        ]
      }),
    };
  }

  if (!match) {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Invalid path. Use /products/{productId}/reviews',
        availableEndpoints: [
          '/products/product-a/reviews',
          '/products/product-b/reviews'
        ]
      }),
    };
  }

  const productId = match[1];
  const data = mockData[productId];

  if (!data) {
    return {
      statusCode: 404,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Product not found' }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  };
};
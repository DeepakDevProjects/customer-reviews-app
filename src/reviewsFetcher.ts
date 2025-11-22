// Fetches product reviews from an upstream API and normalizes them for rendering.
import { ProductReviewsPayload, Review } from './types';

type FetchProductReviewsOptions = {
  apiBaseUrl: string;
  productId: string;
};

type ApiResponse = {
  productId: string;
  productName: string;
  reviews: Array<{
    id: string;
    author: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
};

const buildUrl = (baseUrl: string, productId: string): string =>
  `${baseUrl.replace(/\/$/, '')}/products/${productId}/reviews`;

const normalizeReviews = (reviews: ApiResponse['reviews']): Review[] =>
  reviews.slice(0, 10).map((review) => ({
    id: review.id,
    author: review.author,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  }));

export const fetchProductReviews = async (
  options: FetchProductReviewsOptions
): Promise<ProductReviewsPayload> => {
  const url = buildUrl(options.apiBaseUrl, options.productId);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch reviews for ${options.productId}: ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse;

  return {
    id: payload.productId,
    name: payload.productName,
    reviews: normalizeReviews(payload.reviews ?? []),
  };
};


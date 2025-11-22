// Shared data contracts describing a product and its customer reviews.
export type Review = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type ProductReviewsPayload = {
  id: string;
  name: string;
  reviews: Review[];
};


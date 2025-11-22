// Pure renderer that turns product review data into ESI-friendly HTML fragments.
import { ProductReviewsPayload } from './types';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const renderProductReviewsHtml = (payload: ProductReviewsPayload): string => {
  const topReviews = payload.reviews.slice(0, 10);
  const articles = topReviews
    .map(
      (review) => `
    <article data-review-id="${escapeHtml(review.id)}">
      <header>
        <strong>${escapeHtml(review.author)}</strong>
        <span aria-label="Rating">${review.rating.toFixed(1)}⭐</span>
        <time datetime="${escapeHtml(review.createdAt)}">${escapeHtml(review.createdAt)}</time>
      </header>
      <p>${escapeHtml(review.comment)}</p>
    </article>`
    )
    .join('\n');

  return `<section data-product-id="${escapeHtml(payload.id)}" aria-label="Top reviews for ${escapeHtml(
    payload.name
  )}">
  <h2>${escapeHtml(payload.name)} – Latest Reviews</h2>
  ${articles}
</section>`;
};


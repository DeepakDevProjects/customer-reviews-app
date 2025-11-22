// Thin wrapper around S3 uploads for storing rendered review fragments.
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const s3Client = new S3Client({});

type SaveReviewFragmentInput = {
  bucket: string;
  key: string;
  html: string;
};

export const saveReviewFragment = async ({ bucket, key, html }: SaveReviewFragmentInput) => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: html,
    ContentType: 'text/html; charset=utf-8',
    CacheControl: 'max-age=60',
  });

  await s3Client.send(command);
};


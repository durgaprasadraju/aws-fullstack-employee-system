import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';
import { logger } from '../utils/logger';

/** S3 client — uses IAM role credentials in production (no access keys) */
const s3Client = new S3Client({
  region: config.aws.region,
  ...(config.aws.endpointUrl ? { endpoint: config.aws.endpointUrl, forcePathStyle: true } : {}),
});

/**
 * Generate a pre-signed URL for uploading a profile picture.
 * Bucket remains private; clients upload directly via the signed URL.
 */
export async function getUploadPresignedUrl(
  key: string,
  contentType: string,
  expiresIn = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: config.aws.s3Bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a pre-signed URL for viewing a profile picture.
 */
export async function getDownloadPresignedUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  const command = new GetObjectCommand({
    Bucket: config.aws.s3Bucket,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/** Delete a profile picture object from S3 */
export async function deleteObject(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: config.aws.s3Bucket,
      Key: key,
    })
  );
  logger.info('S3 object deleted', { key });
}

/** Build a unique S3 key for an employee profile picture */
export function buildProfilePictureKey(employeeId: number, filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  return `profiles/${employeeId}/${Date.now()}.${ext}`;
}

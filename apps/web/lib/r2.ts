import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT // E.g., https://<account-id>.r2.cloudflarestorage.com
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME
const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL // E.g., https://assets.techassassin.com or custom domain

let s3Client: S3Client | null = null

if (accessKeyId && secretAccessKey && endpoint) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
} else {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '⚠️ Cloudflare R2 credentials (CLOUDFLARE_R2_ACCESS_KEY_ID, SECRET_ACCESS_KEY, ENDPOINT) are not configured. R2 storage is in bypass mode.'
    )
  }
}

export default s3Client

/**
 * Upload a file buffer to Cloudflare R2
 */
export async function uploadFileToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  if (!s3Client || !bucketName) {
    console.warn('⚠️ R2 client not initialized. Bypassing upload, returning mock URL.')
    return `/mock-uploads/${key}`
  }

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    )

    // Return the public URL if configured, otherwise the R2 URL path
    if (publicUrl) {
      return `${publicUrl.replace(/\/$/, '')}/${key}`
    }
    return `${endpoint}/${bucketName}/${key}`
  } catch (error) {
    console.error(`[R2 Upload Error] Key: ${key}`, error)
    throw new Error('Failed to upload file to storage.')
  }
}

/**
 * Delete a file from Cloudflare R2
 */
export async function deleteFileFromR2(key: string): Promise<void> {
  if (!s3Client || !bucketName) {
    console.warn('⚠️ R2 client not initialized. Bypassing deletion.')
    return
  }

  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    )
  } catch (error) {
    console.error(`[R2 Delete Error] Key: ${key}`, error)
    throw new Error('Failed to delete file from storage.')
  }
}

/**
 * Generate a temporary presigned URL for secure uploads directly from the browser
 */
export async function getR2UploadPresignedUrl(
  key: string,
  contentType: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  if (!s3Client || !bucketName) {
    throw new Error('R2 client not initialized. Cannot generate upload presigned URL.')
  }

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    })

    return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds })
  } catch (error) {
    console.error(`[R2 Presigned URL Error] Key: ${key}`, error)
    throw new Error('Failed to generate presigned upload URL.')
  }
}

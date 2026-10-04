import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Cloudflare R2 through its S3 API. Objects are served publicly from MEDIA_PUBLIC_URL
// (the bucket's custom domain, e.g. https://media.bulbashenko.com).
let client: S3Client | undefined;

function getClient(): S3Client {
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });
  return client;
}

export function isStorageConfigured(): boolean {
  return Boolean(process.env.R2_BUCKET && process.env.MEDIA_PUBLIC_URL);
}

export async function putPublic(key: string, body: Uint8Array, contentType: string): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return `${process.env.MEDIA_PUBLIC_URL}/${key}`;
}

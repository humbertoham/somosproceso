import "server-only";

import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { getR2Env } from "@/lib/env";

let client: S3Client | undefined;

function getClient() {
  const env = getR2Env();
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
  });
  return client;
}

const extensions: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif",
};

export async function uploadCourseImage(file: File) {
  const extension = extensions[file.type];
  if (!extension) throw new Error("El archivo debe ser JPEG, PNG, WebP o AVIF.");
  if (file.size > 5 * 1024 * 1024) throw new Error("La imagen no puede superar 5 MB.");
  const key = `courses/${crypto.randomUUID()}.${extension}`;
  const env = getR2Env();
  await getClient().send(new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: file.type,
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return { key, url: `${env.R2_PUBLIC_URL.replace(/\/$/, "")}/${key}` };
}

export async function deleteCourseImage(key: string) {
  const env = getR2Env();
  await getClient().send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }));
}

import "server-only";

import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { getR2Env } from "@/lib/env";
import { ApiError } from "@/lib/admin-api";
import { imageExtensions, imageValidationError, matchesImageType } from "@/lib/image-validation";
import { imageKeyPattern } from "@/lib/validations/course";

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

export async function uploadCourseImage(file: File) {
  const error = imageValidationError(file);
  if (error) throw new ApiError(error);
  const extension = imageExtensions[file.type];
  const body = Buffer.from(await file.arrayBuffer());
  if (!matchesImageType(body, file.type)) throw new ApiError("El contenido del archivo no coincide con un formato de imagen permitido.");
  const key = `courses/${crypto.randomUUID()}.${extension}`;
  const env = getR2Env();
  await getClient().send(new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: file.type,
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return { key, url: courseImageUrl(key) };
}

function courseImageUrl(key: string) {
  return `${getR2Env().R2_PUBLIC_URL.replace(/\/+$/, "")}/${key}`;
}

export async function verifyCourseImage(key: string | null, url: string | null) {
  if (!key && !url) return { imageKey: null, imageUrl: null };
  if (!key || !imageKeyPattern.test(key) || url !== courseImageUrl(key)) throw new ApiError("Sube la imagen desde el formulario del curso.");
  const object = await getClient().send(new HeadObjectCommand({ Bucket: getR2Env().R2_BUCKET_NAME, Key: key }));
  if (imageValidationError({ size: object.ContentLength ?? 0, type: object.ContentType ?? "" })) throw new ApiError("La imagen subida no es válida.");
  return { imageKey: key, imageUrl: courseImageUrl(key) };
}

export async function deleteCourseImage(key: string) {
  if (!imageKeyPattern.test(key)) return;
  const env = getR2Env();
  await getClient().send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }));
}

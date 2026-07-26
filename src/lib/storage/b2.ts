import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: `https://${process.env.B2_ENDPOINT}`,
  region: "eu-central-003",
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
});

const BUCKET = process.env.B2_BUCKET_NAME!;
const PUBLIC_URL = process.env.B2_PUBLIC_URL!;

export type B2Folder = "avatars" | "listings" | "housing" | "store-assets";

export async function uploadToB2(
  file: Buffer,
  fileName: string,
  folder: B2Folder,
  mimeType: string
): Promise<string> {
  const key = `${folder}/${fileName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file,
      ContentType: mimeType,
    })
  );

  return `${PUBLIC_URL}/${key}`;
}

export async function deleteFromB2(url: string): Promise<void> {
  try {
    const key = url.replace(`${PUBLIC_URL}/`, "");
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
  } catch {
    // Silently fail — file may already be deleted
  }
}

export function generateFileName(originalName: string): string {
  const ext = originalName.split(".").pop() ?? "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${timestamp}-${random}.${ext}`;
}
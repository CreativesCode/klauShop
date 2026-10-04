import "server-only";

import { env } from "@/env.mjs";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: env.NEXT_PUBLIC_S3_REGION,
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
});

export const bufferToFile = (buffer: Buffer) =>
  `data:image/webp;base64,${buffer.toString("base64")}`;

export const uploadImage = async (params: PutObjectCommandInput) => {
  const putObject = new PutObjectCommand(params);
  const s3Response = await s3Client.send(putObject);
  return s3Response;
};

export const deleteImage = async (key: string) => {
  const deleteObject = new DeleteObjectCommand({
    Bucket: env.NEXT_PUBLIC_S3_BUCKET,
    Key: key,
  });
  return s3Client.send(deleteObject);
};

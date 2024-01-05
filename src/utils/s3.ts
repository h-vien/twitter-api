import { S3 } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { config } from 'dotenv'
import fs from 'fs'
import path from 'path'

config()
const s3 = new S3({
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string
  }
})

export const uploadFileToS3 = async ({
  filepath,
  fileName,
  contentType
}: {
  filepath: string
  fileName: string
  contentType: string
}) => {
  const file = fs.readFileSync(filepath)

  const parallelUploads3 = new Upload({
    client: s3,
    params: { Bucket: 'twitter-s3-dlone', Key: fileName, Body: file, ContentType: contentType },

    tags: [
      /*...*/
    ], // optional tags
    queueSize: 4, // optional concurrency configuration
    partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
    leavePartsOnError: false // optional manually handle dropped parts
  })

  return parallelUploads3.done()
}

import { Request } from 'express'
import { getNameFromFullName, handleUploadImage, handleUploadVideo } from '~/utils/file'
import sharp from 'sharp'
import fs from 'fs'
import fsPromise from 'fs/promises'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import path from 'path'
import { isProduction } from '~/utils/config'
import { config } from 'dotenv'
import { MediaType } from '~/constants/enum'
import { Media } from '~/models/Other'
import { uploadFileToS3 } from '~/utils/s3'
import mime from 'mime'

config()

class MediasService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const { newFilename } = files[0]
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullName(file.newFilename)
        const newFullFileName = `${newName}.jpg`
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, newFullFileName)
        await sharp(file.filepath)
          .jpeg({
            quality: 80
          })
          .toFile(newPath)
        const s3Result = await uploadFileToS3({
          fileName: newFullFileName,
          filepath: newPath,
          contentType: mime.getType(newPath) || 'image/*'
        })
        Promise.all([fsPromise.unlink(file.filepath), fsPromise.unlink(newPath)])
        return {
          url: s3Result.Location as string,
          type: MediaType.Image
        }
        return {
          url: isProduction
            ? `${process.env.HOST}/statics/image/${newName}.jpg`
            : `http://localhost:${process.env.PORT}/statics/image/${newName}.jpg`,
          type: MediaType.Image
        }
      })
    )
    return result
  }
  async uploadVideo(req: Request) {
    const files = await handleUploadVideo(req)
    const { newFilename } = files[0]
    return {
      url: isProduction
        ? `${process.env.HOST}/statics/video-stream/${newFilename}`
        : `http://localhost:${process.env.PORT}/statics/video-stream/${newFilename}`,
      type: MediaType.Video
    }
  }
}

const mediasService = new MediasService()

export default mediasService

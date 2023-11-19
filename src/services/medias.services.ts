import { Request } from 'express'
import { getNameFromFullName, handleUploadImage } from '~/utils/file'
import sharp from 'sharp'
import fs from 'fs'
import { UPLOAD_DIR } from '~/constants/dir'
import path from 'path'
import { isProduction } from '~/utils/config'
import { config } from 'dotenv'
import { MediaType } from '~/constants/enum'
import { Media } from '~/models/Other'

config()

class MediasService {
  async uploadImage(req: Request) {
    const files = await handleUploadImage(req)
    const result: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullName(file.newFilename)
        const newPath = path.resolve(UPLOAD_DIR, `${newName}.jpg`)
        await sharp(file.filepath)
          .jpeg({
            quality: 80
          })
          .toFile(newPath)

        fs.unlinkSync(file.filepath)
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
}

const mediasService = new MediasService()

export default mediasService

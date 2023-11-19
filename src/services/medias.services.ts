import { Request } from 'express'
import { getNameFromFullName, handleUploadSingleRequest } from '~/utils/file'
import sharp from 'sharp'
import fs from 'fs'
import { UPLOAD_DIR } from '~/constants/dir'
import path from 'path'

class MediasService {
  async handleUploadSingle(req: Request) {
    const file = await handleUploadSingleRequest(req)
    const newName = getNameFromFullName(file.newFilename)
    const newPath = path.resolve(UPLOAD_DIR, `${newName}.jpg`)
    await sharp(file.filepath)
      .jpeg({
        quality: 80
      })
      .toFile(newPath)

    fs.unlinkSync(file.filepath)
    return `http://localhost:3000/uploads/${newName}.jpg`
  }
}

const mediasService = new MediasService()

export default mediasService

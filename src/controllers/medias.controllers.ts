import { NextFunction, Request, Response } from 'express'
import { handleUploadSingleRequest } from '~/utils/file'

export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  const data = await handleUploadSingleRequest(req)
  return res.json({
    data
  })
}

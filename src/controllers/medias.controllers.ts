import { NextFunction, Request, Response } from 'express'
import mediasService from '~/services/medias.services'

export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  const result = await mediasService.handleUploadSingle(req)
  return res.json({
    data: result
  })
}

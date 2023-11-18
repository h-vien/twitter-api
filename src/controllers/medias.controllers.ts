import { NextFunction, Request, Response } from 'express'
import formidable from 'formidable'
import path from 'path'

export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
  const formidable = (await import('formidable')).default
  const form = formidable({
    uploadDir: path.resolve('uploads'),
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 300 * 1024
  })

  form.parse(req, (err, fields, files) => {
    if (err) throw err
    res.json({
      message: 'Upload success'
    })
  })
  return res.json({
    message: 'Upload success hehe'
  })
}

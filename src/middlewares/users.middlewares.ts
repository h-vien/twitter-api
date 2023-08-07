import { NextFunction, Request, Response } from 'express'

export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  if (!email || !password) {
    res.status(400).send({
      message: 'Email and password are required'
    })
  }
  next()
}

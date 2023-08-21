import e from 'express'
import jwt from 'jsonwebtoken'

interface JWTPayload {
  payload: string | object | Buffer
  options?: jwt.SignOptions
  privateKey?: string
}

export const signToken = ({
  payload,
  options = {
    algorithm: 'HS256'
  },
  privateKey = process.env.JWT_SECRET as string
}: JWTPayload) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (err, token) => {
      if (err) throw reject(err)

      return resolve(String(token))
    })
  })
}

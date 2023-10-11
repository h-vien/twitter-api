import { createHash } from 'crypto'
import dotenv from 'dotenv'

dotenv.config()

export function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}
export function hashPassword(password: string): string {
  return sha256(password + process.env.PASSWORD_SECRET)
}

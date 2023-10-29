import { Request } from 'express'
import User from './models/schemas/User.schema'
import { TokenPayload } from './models/requests/Users.requests'
declare module 'express' {
  interface Request {
    user?: User
    refresh_token?: string
    decoded_authorization?: TokenPayload
    decoded_email_verify_token?: TokenPayload
  }
}

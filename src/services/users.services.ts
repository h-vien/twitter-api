import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { RegisterReqBody } from '~/models/requests/Users.requests'
import { hashPassword } from '~/utils/crypto'
import dotenv from 'dotenv'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import { ObjectId } from 'mongodb'
import RefreshToken from '~/models/schemas/RefresToken.schema'
import { USERS_MESSAGES } from '~/constants/messages'

dotenv.config()

class UsersService {
  private signAccessToken(userID: string) {
    return signToken({
      payload: {
        user_id: userID,
        type: TokenType.AccessToken
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    })
  }
  private signRefreshToken(userID: string) {
    return signToken({
      payload: {
        user_id: userID,
        type: TokenType.RefreshToken
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    })
  }
  private signEmailVerifyToken(userID: string) {
    return signToken({
      payload: {
        user_id: userID,
        type: TokenType.EmailVerifiedToken
      },
      privateKey: process.env.JWT_SECRET_VERIFY_EMAIL_TOKEN as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN
      }
    })
  }
  private signAccessAndRefreshToken(userID: string) {
    return Promise.all([this.signAccessToken(userID), this.signRefreshToken(userID)])
  }
  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const emailVerifyToken = await this.signEmailVerifyToken(user_id.toString())
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verified_token: emailVerifyToken,
        date_of_birth: new Date(payload.date_of_birth),
        password: await hashPassword(payload.password)
      })
    )
    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken(user_id.toString())
    await databaseService.refresh_tokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refreshToken
      })
    )
    return {
      accessToken,
      refreshToken
    }
  }
  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }
  async login(userID: string) {
    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken(userID)
    await databaseService.refresh_tokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(userID),
        token: refreshToken
      })
    )
    return { accessToken, refreshToken }
  }

  async logout(refreshToken: string) {
    await databaseService.refresh_tokens.deleteOne({ token: refreshToken })
    return {
      message: USERS_MESSAGES.LOGOUT_SUCCESS
    }
  }
  async verifyEmail(user_id: string) {
    const [token] = await Promise.all([
      this.signAccessAndRefreshToken(user_id),
      await databaseService.users.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: {
            email_verified_token: '',
            // updated_at: new Date(),
            verify: UserVerifyStatus.Verified
          },
          $currentDate: {
            updated_at: true
          }
        }
      )
    ])
    const [access_token, refresh_token] = token
    return {
      access_token,
      refresh_token
    }
  }

  async resendVerifyEmail(user_id: string) {
    const email_verified_token = await this.signEmailVerifyToken(user_id)
    console.log('Resend verify email', email_verified_token)
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      { $set: { email_verified_token }, $currentDate: { updated_at: true } }
    )
    return {
      message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
    }
  }
}

const usersService = new UsersService()
export default usersService

import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/Users.requests'
import { hashPassword } from '~/utils/crypto'
import dotenv from 'dotenv'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import { ObjectId } from 'mongodb'
import RefreshToken from '~/models/schemas/RefresToken.schema'
import { USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import Follower from '~/models/schemas/Follower.schema'

dotenv.config()

class UsersService {
  private signAccessToken({ userID, verify }: { userID: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id: userID,
        type: TokenType.AccessToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_ACCESS_TOKEN as string,
      options: {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      }
    })
  }
  private signRefreshToken({ userID, verify }: { userID: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id: userID,
        type: TokenType.RefreshToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string,
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    })
  }
  private signEmailVerifyToken({ userID, verify }: { userID: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id: userID,
        type: TokenType.EmailVerifiedToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_VERIFY_EMAIL_TOKEN as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN
      }
    })
  }
  private signForgotPasswordVerifyToken({ userID, verify }: { userID: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: {
        user_id: userID,
        type: TokenType.ForgotPasswordToken,
        verify
      },
      privateKey: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
      options: {
        expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN
      }
    })
  }
  private signAccessAndRefreshToken({ userID, verify }: { userID: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ userID, verify }), this.signRefreshToken({ userID, verify })])
  }
  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const emailVerifyToken = await this.signEmailVerifyToken({
      userID: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verified_token: emailVerifyToken,
        date_of_birth: new Date(payload.date_of_birth),
        password: await hashPassword(payload.password)
      })
    )
    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken({
      userID: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
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
  async login({ userID, verify }: { userID: string; verify: UserVerifyStatus }) {
    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken({ userID, verify })
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
  async verifyEmail(userID: string) {
    const [token] = await Promise.all([
      this.signAccessAndRefreshToken({ userID, verify: UserVerifyStatus.Verified }),
      await databaseService.users.updateOne(
        { _id: new ObjectId(userID) },
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

  async resendVerifyEmail(userID: string) {
    const email_verified_token = await this.signEmailVerifyToken({ userID, verify: UserVerifyStatus.Unverified })
    console.log('Resend verify email', email_verified_token)
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(userID)
      },
      { $set: { email_verified_token }, $currentDate: { updated_at: true } }
    )
    return {
      message: USERS_MESSAGES.RESEND_VERIFY_EMAIL_SUCCESS
    }
  }
  async forgotPassword({ userID, verify }: { userID: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signForgotPasswordVerifyToken({ userID, verify })
    console.log('Forgot password:', forgot_password_token)
    databaseService.users.updateOne(
      {
        _id: new ObjectId(userID)
      },
      {
        $set: {
          forgot_password_token
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    }
  }
  async resetPassword(user_id: string, password: string) {
    await databaseService.users.updateOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        $set: {
          password: hashPassword(password),
          forgot_password_token: ''
        },
        $currentDate: {
          updated_at: true
        }
      }
    )
    return {
      message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS
    }
  }
  async getMe(user_id: string) {
    const result = await databaseService.users.findOne(
      {
        _id: new ObjectId(user_id)
      },
      {
        projection: {
          password: 0,
          email_verified_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return result
  }
  async updateMe(userID: string, payload: UpdateMeReqBody) {
    const _payload = payload.date_of_birth ? { ...payload, date_of_birth: new Date(payload.date_of_birth) } : payload
    const user = await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(userID)
      },
      {
        $set: {
          ..._payload
        },
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          email_verified_token: 0,
          forgot_password_token: 0
        }
      }
    )
    return user.value
  }

  async getUserByUsername(username: string) {
    const user = await databaseService.users.findOne(
      {
        username
      },
      {
        projection: {
          password: 0,
          email_verified_token: 0,
          forgot_password_token: 0
        }
      }
    )
    if (user === null) {
      throw new ErrorWithStatus({
        message: USERS_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    }
    return user
  }

  async follow(userID: string, followedUserID: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(userID),
      followed_user_id: new ObjectId(followedUserID)
    })
    if (!follower)
      await databaseService.followers.insertOne(
        new Follower({
          user_id: new ObjectId(userID),
          followed_user_id: new ObjectId(followedUserID)
        })
      )
    return {
      message: USERS_MESSAGES.FOLLOW_SUCCESS
    }
  }
  async unFollow(userID: string, followedUserID: string) {
    const follower = await databaseService.followers.findOne({
      user_id: new ObjectId(userID),
      followed_user_id: new ObjectId(followedUserID)
    })
    if (!follower) {
      return {
        message: USERS_MESSAGES.USER_NOT_FOUND
      }
    }
    await databaseService.followers.deleteOne({
      user_id: new ObjectId(userID),
      followed_user_id: new ObjectId(followedUserID)
    })

    return {
      message: USERS_MESSAGES.UNFOLLOW_SUCCESS
    }
  }
  async change_password(userID: string, newPassword: string) {
    await databaseService.users.findOneAndUpdate(
      {
        _id: new ObjectId(userID)
      },
      {
        $set: {
          password: hashPassword(newPassword)
        },
        $currentDate: {
          updated_at: true
        }
      }
    )

    return {
      message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS
    }
  }
}

const usersService = new UsersService()
export default usersService

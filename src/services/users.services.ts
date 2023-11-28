import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { RegisterReqBody, UpdateMeReqBody } from '~/models/requests/Users.requests'
import { hashPassword } from '~/utils/crypto'
import dotenv from 'dotenv'
import { signToken, verifyToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import { ObjectId } from 'mongodb'
import RefreshToken from '~/models/schemas/RefresToken.schema'
import { USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import Follower from '~/models/schemas/Follower.schema'
import axios from 'axios'

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
  private signRefreshToken({ userID, verify, exp }: { userID: string; verify: UserVerifyStatus; exp?: number }) {
    if (exp) {
      return signToken({
        payload: {
          user_id: userID,
          type: TokenType.RefreshToken,
          verify,
          exp
        },
        privateKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
      })
    }
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
  private async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return data as {
      access_token: string
      id_token: string
    }
  }
  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    })
    return data as {
      id: string
      email: string
      verified_email: string
      name: string
      given_name: string
      family_name: string
      picture: string
    }
  }

  private decodeRefreshToken(refreshToken: string) {
    return verifyToken({
      token: refreshToken,
      secretOrPublicKey: process.env.JWT_SECRET_REFRESH_TOKEN as string
    })
  }
  async register(payload: RegisterReqBody) {
    const user_id = new ObjectId()
    const emailVerifyToken = await this.signEmailVerifyToken({
      userID: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    await databaseService.users.insertOne(
      new User({
        ...payload,
        _id: user_id,
        email_verified_token: emailVerifyToken,
        date_of_birth: new Date(payload.date_of_birth),
        password: hashPassword(payload.password)
      })
    )
    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken({
      userID: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })
    const { exp, iat } = await this.decodeRefreshToken(refreshToken)
    await databaseService.refresh_tokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refreshToken,
        iat,
        exp
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
    const { iat, exp } = await this.decodeRefreshToken(refreshToken)
    await databaseService.refresh_tokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(userID),
        token: refreshToken,
        iat,
        exp
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
  async refreshToken({
    user_id,
    verify,
    exp,
    refresh_token
  }: {
    user_id: string
    exp: number
    verify: UserVerifyStatus
    refresh_token: string
  }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ userID: user_id, verify }),
      this.signRefreshToken({ userID: user_id, verify, exp }),
      databaseService.refresh_tokens.deleteOne({ token: refresh_token })
    ])
    const decodedRefreshToken = await this.decodeRefreshToken(refresh_token)
    await databaseService.refresh_tokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token,
        iat: decodedRefreshToken.iat,
        exp: decodedRefreshToken.exp
      })
    )
    return {
      access_token: new_access_token,
      refresh_token: new_refresh_token
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

  async oauth(code: string) {
    const { id_token, access_token } = await this.getOauthGoogleToken(code)
    const userInfo = await this.getGoogleUserInfo(access_token, id_token)
    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({ message: USERS_MESSAGES.GMAIL_NOT_VERIFIED, status: HTTP_STATUS.BAD_REQUEST })
    }
    const user = await databaseService.users.findOne({ email: userInfo.email })
    if (user) {
      const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
        userID: user._id.toString(),
        verify: user.verify
      })
      const { exp, iat } = await this.decodeRefreshToken(refresh_token)

      await databaseService.refresh_tokens.insertOne(
        new RefreshToken({
          user_id: new ObjectId(user._id.toString()),
          token: refresh_token,
          iat,
          exp
        })
      )
      return {
        access_token,
        refresh_token,
        newUser: false
      }
    } else {
      const password = Math.random().toString(36).substring(2, 15)
      const data = await this.register({
        email: userInfo.email,
        name: userInfo.name,
        date_of_birth: new Date().toISOString(),
        password,
        confirm_password: password
      })
      return {
        ...data,
        newUser: true
      }
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

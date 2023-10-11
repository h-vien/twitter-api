import User from '~/models/schemas/User.schema'
import databaseService from './database.services'
import { RegisterReqBody } from '~/models/requests/Users.requests'
import { hashPassword } from '~/utils/crypto'
import dotenv from 'dotenv'
import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enum'
import { ObjectId } from 'mongodb'
import RefreshToken from '~/models/schemas/RefresToken.schema'

dotenv.config()

class UsersService {
  private signAccessToken(userID: string) {
    return signToken({
      payload: {
        user_id: userID,
        type: TokenType.AccessToken
      },
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
      options: {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN
      }
    })
  }
  private signAccessAndRefreshToken(userID: string) {
    return Promise.all([this.signAccessToken(userID), this.signRefreshToken(userID)])
  }
  async register(payload: RegisterReqBody) {
    const result = await databaseService.users.insertOne(
      new User({
        ...payload,
        date_of_birth: new Date(payload.date_of_birth),
        password: await hashPassword(payload.password)
      })
    )
    const user_id = result.insertedId.toString()
    const [accessToken, refreshToken] = await this.signAccessAndRefreshToken(user_id)
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
}

const usersService = new UsersService()
export default usersService

import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { pick } from 'lodash'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enum'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import {
  FollowReqBody,
  ForgotPasswordReqBody,
  LoginRequestBody,
  LogoutReqBody,
  RegisterReqBody,
  TokenPayload,
  UpdateMeReqBody,
  VerifyEmailRequestBody
} from '~/models/requests/Users.requests'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'

export const loginController = async (req: Request<ParamsDictionary, any, LoginRequestBody>, res: Response) => {
  const user = req.user as User
  const { _id, verify } = user
  const result = await usersService.login({ userID: _id.toString(), verify })
  return res.status(200).json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  if (req.body) {
    const data = await usersService.register(req.body)

    return res.status(200).json({
      message: USERS_MESSAGES.REGISTER_SUCCESS,
      data
    })
  }
  return res.status(400).json({
    message: 'Register failed '
  })
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
  const { refresh_token } = req.body
  const result = await usersService.logout(refresh_token)

  return res.json({
    message: result.message
  })
}

export const emailVerifyController = async (
  req: Request<ParamsDictionary, any, VerifyEmailRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = await databaseService.users.findOne({
    _id: new ObjectId(user_id)
  })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }
  if (!user.email_verified_token) {
    return res.json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED
    })
  }
  const result = await usersService.verifyEmail(user_id)
  return res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESSFUL,
    result
  })
}

export const resendEmailVerifyController = async (req: Request, res: Response) => {
  console.log(req)
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await databaseService.users.findOne({
    _id: new ObjectId(user_id)
  })
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }
  if (user.verify === UserVerifyStatus.Verified) {
    return res.status(HTTP_STATUS.OK).json({
      message: USERS_MESSAGES.EMAIL_ALREADY_VERIFIED
    })
  }
  const result = await usersService.resendVerifyEmail(user_id)
  return res.json(result)
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
  res: Response
) => {
  const { _id, verify } = req.user as User
  const result = await usersService.forgotPassword({ userID: _id.toString(), verify })
  return res.json(result)
}

export const verifyForgotPasswordTokenController = async (req: Request, res: Response) => {
  return res.json({
    message: USERS_MESSAGES.VERIFY_FORGOT_PASSWORD_SUCCESS
  })
}
export const resetPasswordController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { password } = req.body
  const result = await usersService.resetPassword(user_id, password)
  return res.json(result)
}
export const getMeController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await usersService.getMe(user_id)
  return res.json(user)
}
export const getUserController = async (req: Request, res: Response) => {
  const { username } = req.params
  const user = await usersService.getUserByUsername(username)
  return res.json(user)
}

export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { body } = req
  console.log({ body })
  const user = await usersService.updateMe(user_id, body)
  return res.json({
    message: 'Updated user success',
    data: user
  })
}

export const followController = async (req: Request<ParamsDictionary, any, FollowReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { followed_user_id } = req.body
  const result = await usersService.follow(user_id, followed_user_id)
  return res.json(result)
}

export const unFollowController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { user_id: followed_user_id } = req.params
  const result = await usersService.unFollow(user_id, followed_user_id)
  return res.json(result)
}

export const changePasswordController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { password } = req.body
  const result = await usersService.change_password(user_id, password)
  return res.json(result)
}

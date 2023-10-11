import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { USERS_MESSAGES } from '~/constants/messages'
import { RegisterReqBody } from '~/models/requests/Users.requests'
import User from '~/models/schemas/User.schema'
import usersService from '~/services/users.services'

export const loginController = async (req: Request, res: Response) => {
  const user = req.user as User
  const { _id } = user
  const result = await usersService.login(_id.toString())
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

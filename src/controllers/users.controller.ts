import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import usersService from '~/services/users.services'
import { RegisterReqBody } from '~/models/requests/Users.requests'

export const loginController = (req: Request, res: Response) => {
  const { email, password } = req.body
  if (email === 'vien200203@gmail.com' && password === '123456') {
    return res.status(200).json({
      message: 'Login success '
    })
  }
  return res.status(400).json({
    message: 'Login failed '
  })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  try {
    if (req.body) {
      const data = await usersService.register(req.body)
      console.log(data, 'data')
      return res.status(200).json({
        message: 'Register success ',
        data
      })
    }
  } catch (error) {
    console.log(error)
  }
  return res.status(400).json({
    message: 'Register failed '
  })
}

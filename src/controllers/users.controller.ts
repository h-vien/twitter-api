import { Request, Response } from 'express'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'

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

export const registerController = async (req: Request, res: Response) => {
  const { email, password } = req.body
  try {
    if (email && password) {
      const data = await databaseService.users.insertOne(
        new User({
          email,
          password
        })
      )
      console.log(data, 'data')
      return res.status(200).json({
        message: 'Register success '
      })
    }
  } catch (error) {
    console.log(error)
  }
  return res.status(400).json({
    message: 'Register failed '
  })
}

import { Router } from 'express'
import { loginController, logoutController, registerController } from '~/controllers/users.controller'
import {
  accessTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator
} from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const usersRouter = Router()

usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))

usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))

usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))

export default usersRouter

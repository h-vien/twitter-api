import { Router } from 'express'
import { loginController, registerController } from '~/controllers/users.controller'
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'
import { validate } from '~/utils/validations'

const usersRouter = Router()

usersRouter.post('/login', loginValidator, loginController)

usersRouter.post('/register', validate(registerValidator), wrapRequestHandler(registerController))

export default usersRouter

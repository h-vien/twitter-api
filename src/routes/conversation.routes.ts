import { Router } from 'express'
import { getConversationController } from '~/controllers/conversations.controller'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'

const conversationRouter = Router()

conversationRouter.get('/receiver/:receiver_id', accessTokenValidator, verifiedUserValidator, getConversationController)

export default conversationRouter

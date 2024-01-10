import { ParamsDictionary } from 'express-serve-static-core'
import { NextFunction, Request, Response } from 'express'
import { BookmarkTweetRequestBody } from '~/models/requests/Bookmarks.requests'
import { TokenPayload } from '~/models/requests/Users.requests'
import bookmarkService from '~/services/bookmarks.services'
import conversationService from '~/services/conversations.services'

export const getConversationController = async (req: Request, res: Response, next: NextFunction) => {
  const { receiver_id } = req.params
  const limit = Number(req.query.limit) || 10
  const page = Number(req.query.page) || 1
  const sender_id = req.decoded_authorization?.user_id as string
  console.log('sender_id', sender_id, receiver_id)
  const data = await conversationService.getConversations({
    sender_id,
    receiver_id,
    limit: limit,
    page: page
  })
  return res.json({
    message: 'Get conversations successfully',
    data: {
      conversations: data.result
    },
    metadata: {
      limit,
      page,
      total: data.total
    }
  })
}

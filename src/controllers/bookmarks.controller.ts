import { ParamsDictionary } from 'express-serve-static-core'
import { NextFunction, Request, Response } from 'express'
import { BookmarkTweetRequestBody } from '~/models/requests/Bookmarks.requests'
import { TokenPayload } from '~/models/requests/Users.requests'
import bookmarkService from '~/services/bookmarks.services'

export const bookmarkTweetController = async (
  req: Request<ParamsDictionary, any, BookmarkTweetRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const data = await bookmarkService.bookmarkTweet(user_id, req.body.tweet_id)
  return res.json({
    message: 'Tweet bookmarked successfully',
    data
  })
}

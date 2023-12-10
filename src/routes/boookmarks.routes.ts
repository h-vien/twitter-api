import { Router } from 'express'
import { bookmarkTweetController, unBookmarkTweetController } from '~/controllers/bookmarks.controller'
import { tweetIDValidator } from '~/middlewares/tweets.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const bookmarksRouter = Router()

bookmarksRouter.post(
  '',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIDValidator,
  wrapRequestHandler(bookmarkTweetController)
)

bookmarksRouter.delete(
  '/tweets/:tweet_id',
  accessTokenValidator,
  verifiedUserValidator,
  tweetIDValidator,
  wrapRequestHandler(unBookmarkTweetController)
)

export default bookmarksRouter

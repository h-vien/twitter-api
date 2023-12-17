import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response } from 'express'
import { TweetRequestBody } from '~/models/requests/Tweets.requests'
import tweetsService from '~/services/tweet.services'
import { TokenPayload } from '~/models/requests/Users.requests'

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetRequestBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const data = await tweetsService.createTweet(req.body, user_id)
  return res.json({
    message: 'Create tweet successfully',
    data
  })
}

export const getTweetController = async (req: Request, res: Response) => {
  const result = await tweetsService.increaseView(req.params.tweet_id, req.decoded_authorization?.user_id)
  const tweet = {
    ...req.tweet,
    guest_views: result.guest_views,
    user_views: result.user_views
  }
  return res.json({
    message: 'Get tweet successfully',
    data: tweet
  })
}

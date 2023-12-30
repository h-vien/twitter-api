import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response } from 'express'
import { TweetRequestBody } from '~/models/requests/Tweets.requests'
import tweetsService from '~/services/tweet.services'
import { TokenPayload } from '~/models/requests/Users.requests'
import { TweetType } from '~/constants/enum'

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
    user_views: result.user_views,
    updated_at: result.updated_at
  }
  return res.json({
    message: 'Get tweet successfully',
    data: tweet
  })
}

export const getTweetChildrenController = async (req: Request, res: Response) => {
  const tweet_type = Number(req.query.tweet_type as string) as TweetType
  const page = Number(req.query.page as string)
  const limit = Number(req.query.limit as string)
  const user_id = req.decoded_authorization?.user_id
  const result = await tweetsService.getTweetChildren(req.params.tweet_id, {
    page,
    user_id,
    limit,
    tweet_type
  })
  console.log(result, 'result')
  return res.json({
    message: 'Get tweet Children successfully',
    data: {
      tweets: result.tweets,
      tweet_type,
      page,
      limit,
      totalPage: Math.ceil(result.total / limit)
    }
  })
}

export const getNewFeedController = async (req: Request, res: Response) => {
  const page = Number(req.query.page as string)
  const limit = Number(req.query.limit as string)
  const user_id = req.decoded_authorization?.user_id as string
  const result = await tweetsService.getNewFeeds(user_id, {
    page,
    limit
  })

  return res.json({
    message: 'Get new feed successfully',
    result: {
      tweets: result.tweets,
      page,
      limit,
      totalPage: Math.ceil(result.total / limit)
    }
  })
}

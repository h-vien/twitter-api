import { wrapRequestHandler } from '~/utils/handlers'
import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enum'
import { TWEET_MESSAGES, USERS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import Tweet from '~/models/schemas/Tweet.schema'
import databaseService from '~/services/database.services'
import { numberEnumToArray } from '~/utils/common'
import { validate } from '~/utils/validations'
import HTTP_STATUS from '~/constants/httpStatus'

const tweetTypes = numberEnumToArray(TweetType)
const tweetAudience = numberEnumToArray(TweetAudience)
const mediaTypes = numberEnumToArray(MediaType)
export const createTweetValidator = validate(
  checkSchema(
    {
      type: {
        isIn: {
          options: [tweetTypes],
          errorMessage: TWEET_MESSAGES.INVALID_TWEET_TYPE
        }
      },
      audience: {
        isIn: {
          options: [tweetAudience],
          errorMessage: TWEET_MESSAGES.INVALID_TWEET_AUDIENCE
        }
      },
      parent_id: {
        custom: {
          options: (value, { req }) => {
            const type = req.body.type as TweetType
            if (
              [TweetType.Comment, TweetType.QuoteTweet, TweetType.Retweet].includes(type) &&
              !ObjectId.isValid(value)
            ) {
              throw new Error(TWEET_MESSAGES.PARENT_ID_MUST_BE_A_VALID_OBJECT_ID)
            }
            if (type === TweetType.Tweet && value) {
              throw new Error(TWEET_MESSAGES.PARENT_ID_MUST_BE_NULL)
            }
            return true
          }
        }
      },
      content: {
        isString: true,
        custom: {
          options: (value, { req }) => {
            const type = req.body.type as TweetType
            const hashtags = req.body.hashtags as string[]
            const mentions = req.body.mentions as string[]

            if (
              [TweetType.Comment, TweetType.QuoteTweet, TweetType.Retweet].includes(type) &&
              isEmpty(hashtags) &&
              isEmpty(mentions) &&
              !value
            ) {
              throw new Error(TWEET_MESSAGES.CONTENT_MUST_BE_REQUIRED)
            }
            if (type === TweetType.Tweet && value) {
              throw new Error(TWEET_MESSAGES.CONTENT_MUST_BE_EMPTY)
            }
            return true
          }
        }
      },
      hashtags: {
        isArray: true,
        custom: {
          options: (value, { req }) => {
            if (value.some((item: any) => typeof item !== 'string')) {
              throw new Error(TWEET_MESSAGES.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING)
            }
            return true
          }
        }
      },
      mentions: {
        isArray: true,
        custom: {
          options: (value, { req }) => {
            if (value.some((item: any) => !ObjectId.isValid(item))) {
              throw new Error(TWEET_MESSAGES.MENTIONS_MUST_BE_AN_ARRAY_OF_OBJECT_ID)
            }
            return true
          }
        }
      },
      medias: {
        isArray: true,
        custom: {
          options: (value, { req }) => {
            if (value.some((item: any) => typeof item.url !== 'string' || !mediaTypes.includes(item.type))) {
              throw new Error(TWEET_MESSAGES.INVALID_MEDIA_TYPE)
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const tweetIDValidator = validate(
  checkSchema(
    {
      tweet_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: 400,
                message: 'Tweet id must be a valid object id'
              })
            }
            const [tweet] = await databaseService.tweets
              .aggregate<Tweet>([
                {
                  $match: {
                    _id: new ObjectId(value)
                  }
                },
                {
                  $lookup: {
                    from: 'hashtags',
                    localField: 'hashtags',
                    foreignField: '_id',
                    as: 'hashtags'
                  }
                },
                {
                  $lookup: {
                    from: 'users',
                    localField: 'mentions',
                    foreignField: '_id',
                    as: 'mentions'
                  }
                },
                {
                  $addFields: {
                    mentions: {
                      $map: {
                        input: '$mentions',
                        as: 'mention',
                        in: {
                          _id: '$$mention._id',
                          name: '$$mention.name',
                          username: '$$mention.username',
                          email: '$$mention.email'
                        }
                      }
                    }
                  }
                },
                {
                  $lookup: {
                    from: 'bookmarks',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'bookmarks'
                  }
                },
                {
                  $lookup: {
                    from: 'tweets',
                    localField: '_id',
                    foreignField: 'parent_id',
                    as: 'tweet_children'
                  }
                },
                {
                  $addFields: {
                    retweet_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: { $eq: ['$$item.type', 1] }
                        }
                      }
                    },
                    commnet_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: { $eq: ['$$item.type', 2] }
                        }
                      }
                    },
                    quote_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: { $eq: ['$$item.type', 3] }
                        }
                      }
                    },
                    bookmarks: { $size: '$bookmarks' },
                    views: {
                      $add: ['$user_views', '$guest_views']
                    }
                  }
                }
              ])
              .toArray()
            if (!tweet) {
              throw new ErrorWithStatus({
                status: 404,
                message: 'Tweet not found'
              })
            }
            ;(req as Request).tweet = tweet
            return true
          }
        }
      }
    },
    ['params', 'body']
  )
)

export const audienceValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet
  console.log(tweet, 'tweet')
  if (tweet.audience === TweetAudience.TwitterCircle) {
    if (!req.decoded_authorization)
      throw new ErrorWithStatus({
        status: 401,
        message: 'Unauthorized'
      })

    const { user_id } = req.decoded_authorization
    const author = await databaseService.users.findOne({
      _id: new ObjectId(user_id)
    })
    if (!author || author.verify === UserVerifyStatus.Banned)
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: USERS_MESSAGES.USER_NOT_FOUND
      })
    console.log(author, 'author', tweet.user_id, 'tweet.user_id', author._id, author._id.equals(tweet.user_id))
    const isInTwitterCircle = author.twitter_circle?.some((userCircleID) => userCircleID.equals(tweet.user_id))
    console.log(isInTwitterCircle, 'isInTwitterCircle')

    if (!isInTwitterCircle && !author._id.equals(tweet.user_id))
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: 'You are not in the twitter circle of the tweet author'
      })
  }
  next()
})

export const getTweetChildrenValidator = validate(
  checkSchema({
    tweet_type: {
      isIn: {
        options: [tweetTypes],
        errorMessage: TWEET_MESSAGES.INVALID_TWEET_TYPE
      }
    }
  })
)

export const paginationValidator = validate(
  checkSchema(
    {
      limit: {
        isNumeric: true,
        custom: {
          options: async (value, { req }) => {
            const num = Number(value)
            if (num > 100 && num < 1) {
              throw new Error('Maximum is 100 and minimum is 1')
            }
            return true
          }
        }
      },
      page: {
        isNumeric: true,
        custom: {
          options: async (value, { req }) => {
            const num = Number(value)
            if (num < 1) {
              throw new Error('Minimum is 1')
            }
          }
        }
      }
    },
    ['query']
  )
)

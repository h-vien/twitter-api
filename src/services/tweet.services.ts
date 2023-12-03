import { TweetRequestBody } from '~/models/requests/Tweets.requests'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId } from 'mongodb'

class TweetService {
  async createTweet(body: TweetRequestBody, user_id: string) {
    await databaseService.tweets.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        medias: body.medias,
        parent_id: body.parent_id,
        mentions: body.mentions,
        hashtags: [],
        type: body.type,
        user_id: new ObjectId(user_id)
      })
    )
    return {
      ...body,
      user_id
    }
  }
}

const tweetsService = new TweetService()
export default tweetsService

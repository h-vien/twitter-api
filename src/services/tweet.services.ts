import { TweetRequestBody } from '~/models/requests/Tweets.requests'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtag.schema'

class TweetService {
  async checkAndCreateHashtag(hashtags: string[]) {
    const hashTagDocuments = await Promise.all(
      hashtags.map((hashtag) => {
        return databaseService.hashtags.findOneAndUpdate(
          {
            name: hashtag
          },
          {
            $setOnInsert: new Hashtag({
              name: hashtag
            })
          },
          {
            upsert: true,
            returnDocument: 'after'
          }
        )
      })
    )
    return hashTagDocuments.map((hashtag) => (hashtag.value as WithId<Hashtag>)._id)
  }
  async createTweet(body: TweetRequestBody, user_id: string) {
    const hashTags = await this.checkAndCreateHashtag(body.hashtags)
    await databaseService.tweets.insertOne(
      new Tweet({
        audience: body.audience,
        content: body.content,
        medias: body.medias,
        parent_id: body.parent_id,
        mentions: body.mentions,
        hashtags: hashTags,
        type: body.type,
        user_id: new ObjectId(user_id)
      })
    )
    return {
      ...body,
      hashtags: hashTags,
      user_id
    }
  }
}

const tweetsService = new TweetService()
export default tweetsService

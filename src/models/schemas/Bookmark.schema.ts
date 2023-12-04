import { ObjectId } from 'mongodb'

interface IBookmark {
  _id?: ObjectId
  user_id: ObjectId
  tweet_id: ObjectId
  created_at?: Date
}

export default class Bookmark {
  _id?: ObjectId
  user_id: ObjectId
  tweet_id: ObjectId
  created_at?: Date
  constructor({ _id, created_at, tweet_id, user_id }: IBookmark) {
    this._id = _id || new ObjectId()
    this.tweet_id = tweet_id
    this.user_id = user_id
    this.created_at = created_at || new Date()
  }
}

import { ObjectId } from 'mongodb'

interface IFollower {
  _id?: ObjectId
  user_id: ObjectId
  followed_user_id: ObjectId
  created_at?: Date
}

export default class Follower {
  _id?: ObjectId
  followed_user_id: ObjectId
  created_at: Date
  user_id: ObjectId
  constructor({ _id, created_at, followed_user_id, user_id }: IFollower) {
    this._id = _id
    this.created_at = created_at || new Date()
    this.followed_user_id = followed_user_id
    this.user_id = user_id
  }
}

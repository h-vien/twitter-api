import { ObjectId } from 'mongodb'

interface IRefreshToken {
  _id?: ObjectId
  token: string
  created_at?: Date
  user_id: ObjectId
}

export default class RefreshToken {
  _id?: ObjectId
  token: string
  created_at: Date
  user_id: ObjectId
  constructor({ _id, created_at, token, user_id }: IRefreshToken) {
    this._id = _id
    this.created_at = created_at || new Date()
    this.token = token
    this.user_id = user_id
  }
}

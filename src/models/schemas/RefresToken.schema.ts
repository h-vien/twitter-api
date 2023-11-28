import { ObjectId } from 'mongodb'

interface IRefreshToken {
  _id?: ObjectId
  token: string
  created_at?: Date
  user_id: ObjectId
  iat: number
  exp: number
}

export default class RefreshToken {
  _id?: ObjectId
  token: string
  created_at: Date
  iat: Date
  exp: Date
  user_id: ObjectId
  constructor({ _id, created_at, token, user_id, exp, iat }: IRefreshToken) {
    this._id = _id
    this.user_id = user_id
    this.token = token
    this.created_at = created_at || new Date()
    this.iat = new Date(iat * 1000) // Convert epoch time to date
    this.exp = new Date(exp * 1000)
  }
}

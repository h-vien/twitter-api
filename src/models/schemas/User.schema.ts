import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enum'

interface IUser {
  _id?: ObjectId
  name: string
  email: string
  password: string
  date_of_birth: Date
  created_at?: Date
  updated_at?: Date
  email_verified_token?: string
  forgot_password_token?: string
  verify?: UserVerifyStatus
  bio?: string
  location?: string
  website?: string
  avatar?: string
  username?: string
  cover_photo?: string
}

export default class User {
  _id: ObjectId
  name: string
  email: string
  password: string
  date_of_birth: Date
  created_at: Date
  updated_at: Date
  email_verified_token: string
  forgot_password_token: string
  verify: UserVerifyStatus
  bio: string
  location: string
  website: string
  avatar: string
  username: string
  cover_photo: string
  constructor(user: IUser) {
    const date = new Date()
    this._id = user._id || new ObjectId()
    this.name = user.name || ''
    this.email = user.email
    this.password = user.password
    this.date_of_birth = user.date_of_birth || new Date()
    this.created_at = user.created_at || date
    this.updated_at = user.updated_at || date
    this.email_verified_token = user.email_verified_token || ''
    this.forgot_password_token = user.forgot_password_token || ''
    this.verify = user.verify || UserVerifyStatus.Unverified
    this.bio = user.bio || ''
    this.location = user.location || ''
    this.website = user.website || ''
    this.avatar = user.avatar || ''
    this.username = user.username || ''
    this.cover_photo = user.cover_photo || ''
  }
}

import { Collection, Db, MongoClient, ServerApiVersion } from 'mongodb'
import dotenv from 'dotenv'
import User from '~/models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefresToken.schema'
import Follower from '~/models/schemas/Follower.schema'
import Tweet from '~/models/schemas/Tweet.schema'

dotenv.config()
const connectString = `mongodb://localhost:27017/twitter`

class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(connectString)
    this.db = this.client.db(process.env.DB_NAME)
  }
  async connect() {
    try {
      await this.db.command({ ping: 1 })
      console.log('Ping successfully')
    } catch (error) {
      console.log(error)
    }
  }
  async indexUsers() {
    const existed = await this.users.indexExists(['email_1_password_1', 'email_1', 'username_1'])
    if (!existed) {
      this.users.createIndex({ email: 1, password: 1 })
      this.users.createIndex({ email: 1 }, { unique: true })
      this.users.createIndex({ username: 1 }, { unique: true })
    }
  }

  async indexRefreshTokens() {
    const existed = await this.users.indexExists(['token_1', 'exp_1'])
    if (!existed) {
      this.refresh_tokens.createIndex({ token: 1 }, { unique: true })
      this.refresh_tokens.createIndex(
        { exp: 1 },
        {
          expireAfterSeconds: 0
        }
      )
    }
  }
  async indexFollowers() {
    const existed = await this.users.indexExists(['token_1', 'exp_1'])
    if (!existed) {
      this.followers.createIndex({ follower_user_id: 1, user_id: 1 })
    }
  }

  get users(): Collection<User> {
    return this.db.collection('users')
  }
  get refresh_tokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKEN_COLLECTION as string)
  }
  get followers(): Collection<Follower> {
    return this.db.collection(process.env.DB_FOLLOWERS_COLLECTION as string)
  }
  get tweets(): Collection<Tweet> {
    return this.db.collection(process.env.DB_TWEETS_COLLECTION as string)
  }
}

// Create an object from class DatabaseService

const databaseService = new DatabaseService()
export default databaseService

import { TweetAudience, TweetType } from '~/constants/enum'
import { Media } from '../Other'

export interface TweetRequestBody {
  type: TweetType
  audience: TweetAudience
  content: string
  parent_id: null | string
  mentions: string[]
  hashtags?: string[]
  medias?: Media[]
}

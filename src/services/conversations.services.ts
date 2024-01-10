import { ObjectId } from 'mongodb'
import databaseService from './database.services'

class ConversationService {
  async getConversations({
    sender_id,
    receiver_id,
    limit,
    page
  }: {
    sender_id: string
    receiver_id: string
    limit: number
    page: number
  }) {
    const match = {
      $or: [
        {
          sender_id: new ObjectId(sender_id),
          receiver_id: new ObjectId(receiver_id)
        },
        {
          sender_id: new ObjectId(receiver_id),
          receiver_id: new ObjectId(sender_id)
        }
      ]
    }
    const result = await databaseService.conversations
      .find(match)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    const total = await databaseService.conversations.countDocuments(match)

    return {
      result,
      total
    }
  }
}

const conversationService = new ConversationService()
export default conversationService

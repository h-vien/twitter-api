import { ObjectId } from 'mongodb'

interface IConversation {
  _id?: ObjectId
  sender_id: ObjectId
  receiver_id: ObjectId
  content: string
  created_at?: Date
  updated_at?: Date
}

export default class Conversation {
  _id?: ObjectId
  sender_id: ObjectId
  receiver_id: ObjectId
  content: string
  updated_at?: Date
  created_at?: Date
  constructor({ _id, content, created_at, updated_at, sender_id, receiver_id }: IConversation) {
    const now = new Date()
    this._id = _id || new ObjectId()
    this.sender_id = sender_id
    this.content = content
    this.receiver_id = receiver_id
    this.created_at = created_at || now
    this.updated_at = updated_at || now
  }
}

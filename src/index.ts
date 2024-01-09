import dotenv from 'dotenv'
import express from 'express'
import { UPLOAD_VIDEO_DIR } from './constants/dir'
import { initFolder } from './utils/file'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediaRouter from './routes/medias.routes'
import staticRouter from './routes/statics.routes'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import tweetRouter from './routes/tweets.routes'
import bookmarksRouter from './routes/boookmarks.routes'
import './utils/s3'
import cors, { CorsOptions } from 'cors'
import searchRouter from './routes/search.routes'
import { createServer } from 'http'
import { Server } from 'socket.io'
import Conversation from './models/schemas/Conversations.schema'
// import '~/utils/fake'

dotenv.config()
databaseService.connect().then(() => {
  databaseService.indexUsers()
  databaseService.indexRefreshTokens()
  databaseService.indexFollowers()
})

const app = express()
const httpServer = createServer(app)
const port = process.env.PORT || 4000
initFolder()

app.use(express.json())
const corsOptions: CorsOptions = {
  origin: '*'
}
app.use(cors(corsOptions))

const users: {
  [key: string]: {
    socket_id: string
  }
} = {}

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000'
  }
})

io.on('connection', (socket) => {
  console.log(socket.handshake.auth)
  const userId = socket.handshake.auth._id
  users[userId] = {
    socket_id: socket.id
  }
  socket.on('private message', (data) => {
    console.log(data, '::Log form server')
    const { message, to } = data
    console.log('message', message)
    console.log('to', to)
    databaseService.conversations.insertOne(
      new Conversation({
        sender_id: userId,
        content: message,
        receiver_id: to
      })
    )
    socket.to(users[to].socket_id).emit('receive private message', {
      message,
      from: userId
    })
  })
  console.log(users)
  socket.on('disconnect', () => {
    delete users[userId]
    console.log('DisconnectID:::', socket.id)
    console.log(users)
  })
})

app.use('/users', usersRouter)
app.use('/medias', mediaRouter)
app.use('/tweets', tweetRouter)
app.use('/search', searchRouter)
app.use('/bookmarks', bookmarksRouter)
app.use('/statics/video', express.static(UPLOAD_VIDEO_DIR))
app.use('/statics', staticRouter)

app.use(defaultErrorHandler)

httpServer.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

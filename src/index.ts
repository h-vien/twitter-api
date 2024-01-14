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
import conversationRouter from './routes/conversation.routes'
import { ObjectId } from 'mongodb'
import swaggerUI from 'swagger-ui-express'
import swaggerJSDoc from 'swagger-jsdoc'
import rateLimit from 'express-rate-limit'
import YAML from 'yaml'
// import '~/utils/fake'
import fs from 'fs'
import path from 'path'
import helmet from 'helmet'

// const file = fs.readFileSync(path.resolve('paths.yaml'), 'utf-8')
// const swaggerDocument = YAML.parse(file)
const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'X clone (Twitter API)',
      version: '1.0.0'
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ],
    persistAuthorization: true
  },
  apis: ['./docs/*.yaml'] // files containing annotations as above
}
const openapiSpecification = swaggerJSDoc(options)
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

const corsOptions: CorsOptions = {
  origin: '*'
}
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
  // store: ... , // Use an external store for more precise rate limiting
})

app.use(limiter)
app.use(helmet())
app.use(express.json())
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
        sender_id: new ObjectId(userId),
        content: message,
        receiver_id: new ObjectId(to)
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
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(openapiSpecification))
app.use('/medias', mediaRouter)
app.use('/tweets', tweetRouter)
app.use('/search', searchRouter)
app.use('/conversations', conversationRouter)
app.use('/bookmarks', bookmarksRouter)
app.use('/statics/video', express.static(UPLOAD_VIDEO_DIR))
app.use('/statics', staticRouter)

app.use(defaultErrorHandler)

httpServer.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

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
import searchRouter from './routes/search.routes'
// import '~/utils/fake'

dotenv.config()
databaseService.connect().then(() => {
  databaseService.indexUsers()
  databaseService.indexRefreshTokens()
  databaseService.indexFollowers()
})

const app = express()

const port = process.env.PORT || 4000
initFolder()

app.use(express.json())

app.use('/users', usersRouter)
app.use('/medias', mediaRouter)
app.use('/tweets', tweetRouter)
app.use('/search', searchRouter)
app.use('/bookmarks', bookmarksRouter)
app.use('/statics/video', express.static(UPLOAD_VIDEO_DIR))
app.use('/statics', staticRouter)

app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

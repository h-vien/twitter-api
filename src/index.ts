import dotenv from 'dotenv'
import express from 'express'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'
import mediaRouter from './routes/medias.routes'
import { initFolder } from './utils/file'

dotenv.config()
databaseService.connect()

const app = express()

const port = 4000
initFolder()

app.use(express.json())

app.use('/users', usersRouter)
app.use('/medias', mediaRouter)

app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

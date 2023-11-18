import dotenv from 'dotenv'
import express from 'express'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'

dotenv.config()
databaseService.connect()

const app = express()

console.log(process.env.DB_NAME)
const port = 4000

app.use(express.json())

app.use('/users', usersRouter)

app.use(defaultErrorHandler)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

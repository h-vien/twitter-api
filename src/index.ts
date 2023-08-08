import dotenv from 'dotenv'
import express from 'express'
import usersRouter from './routes/users.routes'
import databaseService from './services/database.services'

dotenv.config()

const app = express()
databaseService.connect()

console.log(process.env.DB_NAME)
const port = 3000

app.use(express.json())

app.use('/users', usersRouter)

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

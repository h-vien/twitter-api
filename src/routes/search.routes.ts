import { Router } from 'express'
import { searchController } from '~/controllers/search.controller'

const searchRouter = Router()

searchRouter.get('/', searchController)

export default searchRouter

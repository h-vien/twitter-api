import { NextFunction, Request, Response } from 'express'
import { SearchQuery } from '~/models/requests/Search.requests'
import { ParamsDictionary } from 'express-serve-static-core'
import searchService from '~/services/search.services'

export const searchController = async (
  req: Request<ParamsDictionary, any, any, SearchQuery>,
  res: Response,
  next: NextFunction
) => {
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)
  const data = await searchService.search(req.decoded_authorization?.user_id as string, {
    page,
    limit,
    content: req.query.content
  })
  return res.json({
    message: 'Search successfully',
    data
  })
}

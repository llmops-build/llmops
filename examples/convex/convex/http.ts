import { httpRouter } from 'convex/server'
import { basePath, llmopsHandler } from './_llmops'

const http = httpRouter()

const methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'] as const

methods.forEach((method) => {
  http.route({ path: basePath, method, handler: llmopsHandler })
  http.route({
    pathPrefix: basePath + '/',
    method,
    handler: llmopsHandler,
  })
})

export default http

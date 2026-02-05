import Fastify from 'fastify'
import cors from '@fastify/cors'
import { db } from './db/index.js'
import { productRoutes } from './routes/products.js'
import { authRoutes } from './routes/auth.js'
import { orderRoutes } from './routes/orders.js'



const fastify = Fastify({
  logger: true
})

// Health check route
fastify.get('/health', async () => {
  return { status: 'ok' }
})


const start = async () => {
  try {
    // Register CORS
    await fastify.register(cors, { origin: true })

    // Global error handler
    fastify.setErrorHandler((error, _request, reply) => {
      fastify.log.error(error)
      const statusCode = (error as any).statusCode || 500
      const errorMessage = (error as Error).message || 'Internal Server Error'
      reply.status(statusCode).send({
        success: false,
        error: errorMessage,
        statusCode
      })
    })

    // Routes
    await fastify.register(authRoutes, { prefix: '/api' })
    await fastify.register(productRoutes, { prefix: '/api' })
    await fastify.register(orderRoutes, { prefix: '/api' })

    await db.query('SELECT 1');
    fastify.log.info('✅ MySQL connected');
    await fastify.listen({ port: 3000, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()

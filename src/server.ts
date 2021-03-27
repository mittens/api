const { PORT } = process.env

import { ApolloServer } from 'apollo-server-fastify'
import { router } from 'bull-board'
import fastify from 'fastify'
import express from 'fastify-express'
import { buildSchema } from 'type-graphql'
import { Container } from 'typedi'

import { authChecker, getUser } from './lib'
import { resolvers } from './resolver'
import { Context, IntegrationContext } from './types'

export const server = async (): Promise<void> => {
  const schema = await buildSchema({
    authChecker,
    container: Container,
    dateScalarMode: 'isoDate',
    resolvers
  })

  const server = fastify()

  await server.register(express)

  const apollo = new ApolloServer({
    async context({ request }: IntegrationContext): Promise<Context> {
      const user = await getUser(request)

      return {
        user
      }
    },
    schema
  })

  server.use('/bull', router)
  server.register(apollo.createHandler())

  await server.listen(Number(PORT), '0.0.0.0')

  console.log(`Running on ${PORT}`)
}

const { TOKEN_SECRET } = process.env

import { User } from '@prisma/client'
import { FastifyRequest } from 'fastify'
import { verify } from 'jsonwebtoken'
import { AuthChecker } from 'type-graphql'

import { db } from '..'
import { AuthToken, Context } from '../types'

export const authChecker: AuthChecker<Context, number> = async ({
  context: { user }
}): Promise<boolean> => !!user

export const getUser = async (req: FastifyRequest): Promise<User | null> => {
  const auth = req.headers.authorization

  if (!auth) {
    return null
  }

  const token = auth.substr(7)

  if (!token) {
    return null
  }

  const { userId } = verify(token, TOKEN_SECRET) as AuthToken

  if (!userId) {
    return null
  }

  const user = await db.user.findUnique({
    where: {
      id: userId
    }
  })

  return user
}

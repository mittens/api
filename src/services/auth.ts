const { TOKEN_SECRET } = process.env

import { Prisma } from '@prisma/client'
import { User } from '@prisma/client'
import { sign } from 'jsonwebtoken'
import { Inject, Service } from 'typedi'

import { db } from '..'
import { queue } from '../queue'
import { AuthResult, SignInInput, SignOutInput } from '../types'
import { GitHubService } from './github'

@Service()
export class AuthService {
  @Inject()
  github!: GitHubService

  async login(code: string): Promise<string> {
    const token = await this.github.login(code)

    return token
  }

  async signIn({
    deviceId,
    githubToken,
    pushToken
  }: SignInInput): Promise<AuthResult> {
    const profile = await this.github.getUser(githubToken)

    const clients: Prisma.ClientCreateOrConnectWithoutUserInput = {
      create: {
        id: deviceId,
        token: pushToken
      },
      where: {
        id: deviceId
      }
    }

    const user = await db.user.upsert({
      create: {
        clients: {
          connectOrCreate: clients
        },
        id: profile.id,
        token: githubToken
      },
      update: {
        clients: {
          connectOrCreate: clients
        },
        fetchedAt: new Date()
      },
      where: {
        id: profile.id
      }
    })

    const job = await queue.getJob(`user-${user.id}`)

    if (!job) {
      await queue.add(
        'fetch',
        {
          userId: user.id
        },
        {
          delay: 60 * 1000,
          jobId: `user-${user.id}`,
          repeat: {
            every: 60 * 1000
          }
        }
      )
    }

    return this.token(user)
  }

  async signOut({ id }: User, { deviceId }: SignOutInput): Promise<boolean> {
    const user = await db.user.update({
      data: {
        clients: {
          delete: {
            id: deviceId
          }
        }
      },
      include: {
        clients: true
      },
      where: {
        id
      }
    })

    if (user.clients.length === 0) {
      await queue.removeRepeatableByKey(`fetch:user-${user.id}:::60000`)
    }

    return true
  }

  private token(user: User): AuthResult {
    const token = sign(
      {
        userId: user.id
      },
      TOKEN_SECRET
    )

    return {
      token
    }
  }
}

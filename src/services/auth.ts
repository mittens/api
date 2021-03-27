const { TOKEN_SECRET } = process.env

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

    const user = await db.user.upsert({
      create: {
        clients: {
          connectOrCreate: {
            create: {
              id: deviceId,
              token: pushToken
            },
            where: {
              id: deviceId
            }
          }
        },
        id: profile.id,
        token: githubToken
      },
      update: {
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
      select: {
        clients: true
      },
      where: {
        id
      }
    })

    if (user.clients.length === 0) {
      const job = await queue.getJob(`user-${id}`)

      await job?.remove()
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

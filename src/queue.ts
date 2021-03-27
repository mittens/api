const { REDIS_URL } = process.env

import { BullMQAdapter, setQueues } from 'bull-board'
import { Queue, Worker } from 'bullmq'
import Redis from 'ioredis'

import { db } from '.'
import { FirebaseService, GitHubService } from './services'

const connection = new Redis(REDIS_URL)

const QUEUE_NAME = 'notifications'

export const queue = new Queue(QUEUE_NAME, {
  connection
})

setQueues([new BullMQAdapter(queue)])

export const worker = (): void => {
  const firebase = new FirebaseService()
  const github = new GitHubService()

  new Worker(
    QUEUE_NAME,
    async ({ data }) => {
      const { userId } = data

      const user = await db.user.findUnique({
        include: {
          clients: true
        },
        where: {
          id: userId
        }
      })

      if (user) {
        const notifications = await github.getNotifications(
          user.token,
          user.fetchedAt
        )

        if (notifications.length > 0) {
          await firebase.notify(user.clients, notifications)

          return `${notifications.length} sent`
        }

        await db.user.update({
          data: {
            fetchedAt: new Date()
          },
          where: {
            id: user.id
          }
        })

        return 'no unread notifications'
      }

      return 'user not found'
    },
    {
      connection
    }
  )
}

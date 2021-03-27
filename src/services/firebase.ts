const {
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_PROJECT_ID
} = process.env

import { Client } from '@prisma/client'
import admin, { messaging } from 'firebase-admin'
import { Service } from 'typedi'

import { Notification } from '../types'

@Service()
export class FirebaseService {
  constructor() {
    if (admin.apps.length === 0) {
      const privateKey = Buffer.from(FIREBASE_PRIVATE_KEY, 'base64').toString(
        'utf8'
      )

      admin.initializeApp({
        credential: admin.credential.cert({
          clientEmail: FIREBASE_CLIENT_EMAIL,
          privateKey,
          projectId: FIREBASE_PROJECT_ID
        })
      })
    }
  }

  async notify(
    clients: Client[],
    notifications: Notification[]
  ): Promise<void> {
    const messages: messaging.Message[] = clients
      .map((client) =>
        notifications.map((notification) => ({
          android: {
            collapseKey: notification.id
          },
          apns: {
            headers: {
              'apns-collapse-id': notification.id
            },
            payload: {
              aps: {
                badge: notifications.length
              }
            }
          },
          notification: {
            body: notification.body,
            title: notification.repository
          },
          token: client.token
        }))
      )
      .flat()

    await messaging().sendAll(messages)
  }
}

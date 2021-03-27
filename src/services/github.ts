const { GITHUB_ID, GITHUB_SECRET } = process.env

import axios from 'axios'
import { isAfter } from 'date-fns'
import { parseISO } from 'date-fns'
import { Service } from 'typedi'

import {
  GitHubAuthResponse,
  GitHubNotification,
  GitHubUser,
  GitHubUserResponse,
  Notification
} from '../types'

@Service()
export class GitHubService {
  async login(code: string): Promise<string> {
    const {
      data: { access_token }
    } = await axios.request<GitHubAuthResponse>({
      headers: {
        accept: 'application/json'
      },
      params: {
        client_id: GITHUB_ID,
        client_secret: GITHUB_SECRET,
        code
      },
      url: 'https://github.com/login/oauth/access_token'
    })

    return access_token
  }

  async getUser(token: string): Promise<GitHubUser> {
    const {
      data: { avatar_url, id, login }
    } = await axios.request<GitHubUserResponse>({
      headers: {
        accept: 'application/json',
        authorization: `token ${token}`,
        'user-agent': 'Mittens'
      },
      url: 'https://api.github.com/user'
    })

    return {
      avatar: avatar_url,
      id,
      username: login
    }
  }

  async getNotifications(
    token: string,
    fetchedAt: Date
  ): Promise<Array<Notification>> {
    const { data } = await axios.request<GitHubNotification[]>({
      headers: {
        accept: 'application/json',
        authorization: `token ${token}`,
        'user-agent': 'Mittens'
      },
      url: 'https://api.github.com/notifications'
    })

    const notifications = data.map(
      ({
        id,
        repository: { full_name },
        subject: { title },
        unread,
        updated_at
      }) => ({
        body: title,
        id,
        repository: full_name,
        unread,
        updatedAt: parseISO(updated_at)
      })
    )

    return notifications.filter(({ updatedAt }) =>
      isAfter(updatedAt, fetchedAt)
    )
  }
}

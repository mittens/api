import { User } from '@prisma/client'
import { FastifyReply, FastifyRequest } from 'fastify'
import { Field, InputType, Int, ObjectType } from 'type-graphql'

// server

export type Context = {
  user: User | null
}

export type IntegrationContext = {
  request: FastifyRequest
  reply: FastifyReply
}

// jobs

export type JobData = {
  userId: number
}

// github

export type GitHubAuthResponse = {
  access_token: string
}

export type GitHubUserResponse = {
  id: number
  avatar_url: string
  login: string
}

export type GitHubUser = {
  id: number
  avatar: string
  username: string
}

export type GitHubNotification = {
  id: string
  repository: {
    full_name: string
  }
  subject: {
    title: string
    type: string
    url: string
  }
  unread: boolean
  updated_at: string
}

// type

export type Notification = {
  id: string
  body: string
  repository: string
  unread: boolean
  updatedAt: Date
}

// graphql

export type AuthToken = {
  userId: number
}

@ObjectType()
export class ProfileResult {
  @Field(() => Int)
  id!: number

  @Field()
  fetchedAt!: Date
}

@ObjectType()
export class LoginResult {
  @Field()
  token!: string
}

@ObjectType()
export class AuthResult {
  @Field()
  token!: string
}

// input

@InputType()
export class SignInInput {
  @Field()
  githubToken!: string

  @Field()
  deviceId!: string

  @Field()
  pushToken!: string
}

@InputType()
export class SignOutInput {
  @Field()
  deviceId!: string
}

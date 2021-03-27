import { User } from '@prisma/client'
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { Inject, Service } from 'typedi'

import { AuthService } from '../services'
import {
  AuthResult,
  LoginResult,
  ProfileResult,
  SignInInput,
  SignOutInput
} from '../types'

@Service()
@Resolver()
export class AuthResolver {
  @Inject()
  auth!: AuthService

  @Mutation(() => LoginResult)
  async login(@Arg('code') code: string): Promise<LoginResult> {
    const token = await this.auth.login(code)

    return {
      token
    }
  }

  @Mutation(() => AuthResult)
  signIn(@Arg('data') data: SignInInput): Promise<AuthResult> {
    return this.auth.signIn(data)
  }

  @Query(() => ProfileResult)
  @Authorized()
  profile(@Ctx('user') user: User): ProfileResult {
    return user
  }

  @Mutation(() => Boolean)
  @Authorized()
  signOut(
    @Ctx('user') user: User,
    @Arg('data') data: SignOutInput
  ): Promise<boolean> {
    return this.auth.signOut(user, data)
  }
}

import 'reflect-metadata'

import { PrismaClient } from '@prisma/client'

import { worker } from './queue'
import { server } from './server'

export const db = new PrismaClient()

server()
worker()

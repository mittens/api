import 'reflect-metadata'

import { PrismaClient } from '@prisma/client'

import { createWorker } from './queue'
import { createServer } from './server'

export const db = new PrismaClient()

const main = async (): Promise<void> => {
  const server = await createServer()
  const worker = createWorker()

  process.on('SIGTERM', async () => {
    await server.close()
    await worker.close()

    process.exit(0)
  })
}

main()

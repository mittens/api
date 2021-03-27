declare namespace NodeJS {
  export interface ProcessEnv {
    TOKEN_SECRET: string

    REDIS_URL: string

    GITHUB_ID: string
    GITHUB_SECRET: string

    FIREBASE_CLIENT_EMAIL: string
    FIREBASE_PRIVATE_KEY: string
    FIREBASE_PROJECT_ID: string
  }
}

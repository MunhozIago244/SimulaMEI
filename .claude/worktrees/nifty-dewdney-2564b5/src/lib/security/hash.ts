import { createHmac, timingSafeEqual } from 'node:crypto'

const HASH_SECRET_ENV = 'APP_HASH_SECRET'

function getHashSecret() {
  const secret = process.env[HASH_SECRET_ENV]?.trim()

  if (!secret) {
    throw new Error(`${HASH_SECRET_ENV} is required for security-sensitive hashing.`)
  }

  return secret
}

export function hashValueWithSecret(value: string, secret = getHashSecret()): string {
  return createHmac('sha256', secret).update(value).digest('hex')
}

export function hashIpAddress(ipAddress: string, secret = getHashSecret()): string {
  return hashValueWithSecret(`ip:${ipAddress}`, secret)
}

export function hashApiKey(apiKey: string, secret = getHashSecret()): string {
  return hashValueWithSecret(`api-key:${apiKey}`, secret)
}

export function verifyApiKeyHash(apiKey: string, expectedHash: string, secret = getHashSecret()): boolean {
  const actualHash = hashApiKey(apiKey, secret)
  const actualBuffer = Buffer.from(actualHash, 'utf8')
  const expectedBuffer = Buffer.from(expectedHash, 'utf8')

  if (actualBuffer.length !== expectedBuffer.length) {
    return false
  }

  return timingSafeEqual(actualBuffer, expectedBuffer)
}

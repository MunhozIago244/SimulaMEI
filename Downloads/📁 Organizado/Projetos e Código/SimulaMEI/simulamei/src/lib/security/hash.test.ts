import { describe, expect, it } from 'vitest'
import { hashApiKey, hashIpAddress, hashValueWithSecret } from './hash'

describe('security hashing', () => {
  it('uses a keyed hash so the same input changes with the secret', () => {
    const hashA = hashValueWithSecret('abc', 'secret-a')
    const hashB = hashValueWithSecret('abc', 'secret-b')

    expect(hashA).not.toBe(hashB)
  })

  it('namespaces API keys and IP addresses before hashing', () => {
    expect(hashApiKey('smei_test_123', 'secret-a')).toBe(
      hashValueWithSecret('api-key:smei_test_123', 'secret-a'),
    )

    expect(hashIpAddress('127.0.0.1', 'secret-a')).toBe(
      hashValueWithSecret('ip:127.0.0.1', 'secret-a'),
    )
  })
})

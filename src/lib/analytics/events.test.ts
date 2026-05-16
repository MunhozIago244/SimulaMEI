import { describe, expect, it } from 'vitest'
import { buildEmailCapturedProps } from './events'

describe('buildEmailCapturedProps', () => {
  it('carries cnae, taxRuleVersion and leadSaveStatus=saved when the lead persisted', () => {
    const props = buildEmailCapturedProps(
      { entrada: { cnae: '9602-5/01' }, taxRuleVersion: 'BR-MEI-SN-2026-04-28' },
      'saved',
    )

    expect(props).toEqual({
      cnae: '9602-5/01',
      taxRuleVersion: 'BR-MEI-SN-2026-04-28',
      leadSaveStatus: 'saved',
    })
  })

  it('marks leadSaveStatus=failed when the lead did not persist', () => {
    const props = buildEmailCapturedProps(
      { entrada: { cnae: '4781-4/00' }, taxRuleVersion: 'v1' },
      'failed',
    )

    expect(props.leadSaveStatus).toBe('failed')
  })
})

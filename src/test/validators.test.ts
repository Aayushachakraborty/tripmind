import { describe, expect, it } from 'vitest'
import { sanitiseInput, validatePreferences } from '../utils/validators'

const validPreferences = {
  destination: 'Jaipur',
  startDate: '2026-06-10',
  endDate: '2026-06-12',
  budgetPreset: 'comfort',
  dietary: ['veg'],
  pace: 'moderate',
  interests: ['History'],
  groupType: 'couple',
  transport: 'train',
  accessibilityNeeds: ''
}

describe('validators', () => {
  it('sanitises unsafe HTML input', () => {
    expect(sanitiseInput('<script>alert(1)</script>hello')).toBe('hello')
    expect(sanitiseInput('<b>bold</b>')).toBe('bold')
  })

  it('rejects empty preference input', () => {
    expect(() => validatePreferences({})).toThrow()
  })

  it('accepts valid preference input', () => {
    expect(validatePreferences(validPreferences)).toMatchObject({
      destination: 'Jaipur',
      dietary: ['veg'],
      interests: ['History']
    })
  })
})

import { describe, expect, it } from 'vitest'
import { formatDuration, formatINR } from '../utils/formatters'

describe('formatters', () => {
  it('formats INR with Indian digit grouping', () => {
    expect(formatINR(1000)).toBe('₹1,000')
    expect(formatINR(100000)).toBe('₹1,00,000')
  })

  it('formats minutes as compact duration text', () => {
    expect(formatDuration(90)).toBe('1h 30m')
    expect(formatDuration(45)).toBe('45m')
  })
})

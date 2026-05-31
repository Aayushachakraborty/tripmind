import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTripPlanner } from '../hooks/useTripPlanner'
import type { PreferencesInput, TripResponse } from '../lib/schemas'

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'token' } } })
    }
  }
}))

const preferences: PreferencesInput = {
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

const tripResponse: TripResponse = {
  request_id: 'req_1',
  trip_id: 'trip_1',
  itinerary: {
    destination: 'Jaipur',
    total_cost_inr: 5000,
    scores: { overall: 90, budget: 90, dietary: 90, accessibility: 90, interests: 90, pace: 90 },
    constraints: [],
    festival_warnings: [],
    warnings: [],
    train: {
      train_name: 'Ajmer Shatabdi',
      train_number: '12015',
      from: 'Delhi',
      to: 'Jaipur',
      class: 'CC',
      fare_inr: 900,
      duration: '4h 30m',
      irctc_url: 'https://www.irctc.co.in/'
    },
    days: [
      {
        day: 1,
        date: '2026-06-10',
        title: 'Pink City',
        city: 'Jaipur',
        estimated_cost_inr: 2500,
        activities: [
          {
            id: 'a1',
            time: '09:00',
            title: 'Amber Fort',
            location: 'Amber',
            category: 'History',
            description: 'Explore the fort.',
            local_tip: 'Arrive early for smaller crowds.',
            cost_inr: 500,
            duration_minutes: 120,
            dietary_tags: ['veg'],
            accessibility_notes: 'Some ramps available.',
            must_do: true
          }
        ]
      }
    ]
  }
}

describe('useTripPlanner', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('turns loading true when plan starts', async () => {
    let resolveFetch!: (value: Response) => void
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve
          })
      )
    )
    const { result } = renderHook(() => useTripPlanner())

    let request!: Promise<TripResponse>
    act(() => {
      request = result.current.plan(preferences)
    })

    await waitFor(() => expect(result.current.loading).toBe(true))

    resolveFetch({
      ok: true,
      json: async () => tripResponse
    } as Response)
    await act(async () => {
      await request
    })
  })

  it('sets error state on fetch failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Planning failed loudly' })
      })
    )
    const { result } = renderHook(() => useTripPlanner())

    await act(async () => {
      await expect(result.current.plan(preferences)).rejects.toThrow('Planning failed loudly')
    })

    expect(result.current.error).toBe('Planning failed loudly')
    expect(result.current.loading).toBe(false)
  })

  it('sets itinerary on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => tripResponse
      })
    )
    const { result } = renderHook(() => useTripPlanner())

    await act(async () => {
      await result.current.plan(preferences)
    })

    expect(result.current.itinerary).toMatchObject({ destination: 'Jaipur' })
    expect(result.current.tripId).toBe('trip_1')
    expect(result.current.requestId).toBe('req_1')
  })
})

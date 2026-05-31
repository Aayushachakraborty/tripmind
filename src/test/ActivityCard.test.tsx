import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ActivityCard } from '../components/ActivityCard'
import type { Activity } from '../lib/schemas'

const activity: Activity = {
  id: 'a1',
  time: '09:00',
  title: 'Amber Fort',
  location: 'Amber',
  category: 'History',
  description: 'Explore the fort.',
  local_tip: 'Arrive before the tour groups.',
  cost_inr: 1000,
  duration_minutes: 90,
  dietary_tags: ['veg'],
  accessibility_notes: '',
  must_do: true
}

describe('ActivityCard', () => {
  it('renders activity details', () => {
    render(<ActivityCard activity={activity} />)

    expect(screen.getByText('Amber Fort')).toBeInTheDocument()
    expect(screen.getByText('₹1,000')).toBeInTheDocument()
    expect(screen.getByText('Must-do')).toBeInTheDocument()
    expect(screen.getByText('Arrive before the tour groups.')).toBeInTheDocument()
  })
})

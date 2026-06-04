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
  dietary_tags: ['vegetarian'],
  accessibility_notes: '',
  must_do: true
}

describe('ActivityCard', () => {
  it('renders activity details with selected-currency pricing', () => {
    render(<ActivityCard activity={activity} />)

    expect(screen.getByText('Amber Fort')).toBeInTheDocument()
    expect(screen.getByText('$12')).toBeInTheDocument()
    expect(screen.getByText('Must-do')).toBeInTheDocument()
    expect(screen.getByText('Arrive before the tour groups.')).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TrainCard } from '../components/TrainCard'
import type { Itinerary } from '../lib/schemas'

const train: Itinerary['train'] = {
  train_name: 'Ajmer Shatabdi',
  train_number: '12015',
  from: 'Delhi',
  to: 'Jaipur',
  class: 'CC',
  fare_inr: 900,
  duration: '4h 30m',
  irctc_url: 'https://www.irctc.co.in/nget/train-search'
}

describe('TrainCard', () => {
  it('renders train name and secure IRCTC link', () => {
    render(<TrainCard train={train} />)

    expect(screen.getByText(/Ajmer Shatabdi/)).toBeInTheDocument()

    const link = screen.getByRole('link', { name: /book on irctc/i })
    expect(link).toHaveAttribute('href', 'https://www.irctc.co.in/nget/train-search')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })
})

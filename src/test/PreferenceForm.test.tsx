import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PreferenceForm } from '../components/PreferenceForm'

describe('PreferenceForm', () => {
  it('renders destination input and submit button', () => {
    render(<PreferenceForm loading={false} onSubmit={vi.fn()} />)

    expect(screen.getByLabelText(/destination/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /plan my trip/i })).toBeInTheDocument()
  })

  it('renders dietary pills', () => {
    render(<PreferenceForm loading={false} onSubmit={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Veg' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Jain' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Halal' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Egg' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Non-veg' })).toBeInTheDocument()
  })

  it('auto-selects veg when jain is selected', async () => {
    const user = userEvent.setup()
    render(<PreferenceForm loading={false} onSubmit={vi.fn()} />)

    const veg = screen.getByRole('button', { name: 'Veg' })
    const jain = screen.getByRole('button', { name: 'Jain' })

    await user.click(veg)
    expect(veg).not.toHaveClass('active')

    await user.click(jain)
    expect(jain).toHaveClass('active')
    expect(veg).toHaveClass('active')
  })
})

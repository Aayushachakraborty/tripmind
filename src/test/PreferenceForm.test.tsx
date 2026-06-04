import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PreferenceForm } from '../components/PreferenceForm'

describe('PreferenceForm', () => {
  it('renders destination input and submit button', () => {
    render(<PreferenceForm loading={false} onSubmit={vi.fn()} />)

    expect(screen.getByLabelText(/^destination$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /plan my trip/i })).toBeInTheDocument()
  })

  it('renders dietary pills', () => {
    render(<PreferenceForm loading={false} onSubmit={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Vegetarian' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Vegan' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Halal' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gluten-free' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kosher' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'No preference' })).toBeInTheDocument()
  })

  it('keeps no preference mutually exclusive', async () => {
    const user = (await import('@testing-library/user-event')).default.setup()
    render(<PreferenceForm loading={false} onSubmit={vi.fn()} />)

    const noPreference = screen.getByRole('button', { name: 'No preference' })
    const vegan = screen.getByRole('button', { name: 'Vegan' })

    expect(noPreference).toHaveClass('active')

    await user.click(vegan)
    expect(vegan).toHaveClass('active')
    expect(noPreference).not.toHaveClass('active')
  })
})

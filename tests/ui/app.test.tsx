// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, within, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

afterEach(cleanup)

// The globe uses WebGL, which jsdom can't run — mock it with a noop imperative API.
vi.mock('../../src/globe/GlobeCanvas', async () => {
  const React = await import('react')
  const GlobeCanvas = React.forwardRef((_props: unknown, ref: React.Ref<unknown>) => {
    React.useImperativeHandle(ref, () => ({
      updateCountries() {},
      rotateToCountry() {},
      toggleZoom() {},
      reset() {},
    }))
    return React.createElement('div', { 'data-testid': 'globe-mock' })
  })
  return { GlobeCanvas }
})

// Avoid any real network from the leaderboard service.
vi.mock('../../src/services/leaderboard', () => ({
  getTop: vi.fn(async () => ({ ok: true, data: [] })),
  submitScore: vi.fn(async () => ({ ok: true, data: [] })),
}))

import App from '../../src/App'

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('cote_onboarded', '1') // skip onboarding for gameplay tests
})

async function start(user: ReturnType<typeof userEvent.setup>) {
  render(<App />)
  await user.click(await screen.findByRole('button', { name: 'Start' }))
  return screen.findByPlaceholderText(/type a country name/i)
}

describe('App — core flow', () => {
  it('shows the welcome screen with a Start button', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'COTE' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
  })

  it('starts a game and focuses the input', async () => {
    const user = userEvent.setup()
    const input = await start(user)
    await waitFor(() => expect(input).toHaveFocus())
  })

  it('accepts an exact country and updates the count + continent', async () => {
    const user = userEvent.setup()
    const input = await start(user)
    await user.type(input, 'France')
    // Input clears on accept.
    await waitFor(() => expect(input).toHaveValue(''))
    // Europe tab reflects the find.
    expect(await screen.findByText('1/49')).toBeInTheDocument()
  })

  it('accepts a canonical name, an alias, and a typo on Enter', async () => {
    const user = userEvent.setup()
    const input = await start(user)
    // Canonical (South America).
    await user.type(input, 'Brazil')
    await waitFor(() => expect(input).toHaveValue(''))
    // Alias "uk" → United Kingdom (Europe).
    await user.type(input, 'uk')
    await waitFor(() => expect(input).toHaveValue(''))
    // Fuzzy on Enter → Germany (Europe).
    await user.type(input, 'Germny{Enter}')
    await waitFor(() => expect(input).toHaveValue(''))

    expect(await screen.findByText('1/12')).toBeInTheDocument() // S. America
    expect(await screen.findByText('2/49')).toBeInTheDocument() // Europe (UK + Germany)
  })

  it('gives up through the confirm dialog and shows results', async () => {
    const user = userEvent.setup()
    const input = await start(user)
    await user.type(input, 'France')

    await user.click(await screen.findByRole('button', { name: 'Give Up' }))
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Give up' }))

    expect(await screen.findByRole('heading', { name: 'Session Results' })).toBeInTheDocument()
  })
})

describe('App — modals & onboarding', () => {
  it('shows onboarding on first play and remembers it', async () => {
    localStorage.clear() // first-time player
    const user = userEvent.setup()
    render(<App />)
    await user.click(await screen.findByRole('button', { name: 'Start' }))
    expect(await screen.findByRole('heading', { name: 'How to Play' })).toBeInTheDocument()
    expect(localStorage.getItem('cote_onboarded')).toBe('1')
  })

  it('opens instructions and closes on Escape', async () => {
    const user = userEvent.setup()
    await start(user)
    await user.click(screen.getByRole('button', { name: 'How to play' }))
    expect(await screen.findByRole('heading', { name: 'How to Play' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'How to Play' })).not.toBeInTheDocument(),
    )
  })
})

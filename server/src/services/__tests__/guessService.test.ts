import { describe, it, expect } from '@jest/globals'
import { normalize, isFuzzyMatch } from '../guessService.js'

describe('normalize', () => {
  it('lowercases and strips punctuation', () => {
    expect(normalize('Daft Punk!')).toBe('daft punk')
    expect(normalize('AC/DC')).toBe('acdc')
  })

  it('strips diacritics so accented inputs match unaccented inputs', () => {
    expect(normalize('Beyoncé')).toBe('beyonce')
    expect(normalize('Mötley Crüe')).toBe('motley crue')
    expect(normalize('Sigur Rós')).toBe('sigur ros')
    expect(normalize('Édith Piaf')).toBe('edith piaf')
  })

  it('two forms of the same name produce equal normalized output', () => {
    expect(normalize('Beyoncé')).toBe(normalize('beyonce'))
    expect(normalize('Céline Dion')).toBe(normalize('celine dion'))
  })

  it('preserves internal whitespace (so the fuzzy distance metric stays meaningful)', () => {
    expect(normalize('Pink Floyd')).toContain(' ')
  })

  it('normalizes digits', () => {
    expect(normalize('blink-182')).toBe('blink182')
    expect(normalize('U2')).toBe('u2')
  })

  it('keeps Hebrew characters', () => {
    expect(normalize('שלום')).toBe('שלום')
  })

  it('returns empty string for input with no alphanumerics (anti-cheat: empty input must not pass match)', () => {
    expect(normalize('!!!')).toBe('')
    expect(normalize('   ')).toBe('')
    expect(normalize('😀😀')).toBe('')
  })
})

describe('isFuzzyMatch', () => {
  it('returns true for an exact match', () => {
    expect(isFuzzyMatch('beatles', 'Beatles')).toBe(true)
  })

  it('returns true for an accented vs unaccented match', () => {
    expect(isFuzzyMatch('beyonce', 'Beyoncé')).toBe(true)
  })

  it('returns true when input is a substring of target', () => {
    expect(isFuzzyMatch('beatles', 'The Beatles')).toBe(true)
  })

  it('returns true when target is a substring of input', () => {
    expect(isFuzzyMatch('The Beatles', 'beatles')).toBe(true)
  })

  it('returns true for a small typo within fuzzy distance', () => {
    // distance 1 within a length-7 target
    expect(isFuzzyMatch('beatlse', 'beatles')).toBe(true)
  })

  it('returns false for unrelated strings', () => {
    expect(isFuzzyMatch('queen', 'metallica')).toBe(false)
  })

  // Anti-cheat regression: empty input from a junk guess must NEVER match.
  it('returns false when input normalizes to empty (anti-cheat fix)', () => {
    expect(isFuzzyMatch('!!!', 'Beatles')).toBe(false)
    expect(isFuzzyMatch('😀', 'Beatles')).toBe(false)
    expect(isFuzzyMatch('   ', 'Beatles')).toBe(false)
  })

  it('returns false when target normalizes to empty', () => {
    expect(isFuzzyMatch('Beatles', '!!!')).toBe(false)
  })
})

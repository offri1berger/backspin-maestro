import { describe, it, expect } from '@jest/globals'
import { normalize } from '../guessService.js'

describe('normalize', () => {
  it('lowercases and strips punctuation', () => {
    expect(normalize('Daft Punk!')).toBe('daftpunk')
    expect(normalize('  AC/DC  ')).toBe('acdc')
  })

  it('strips diacritics so accented inputs match unaccented inputs', () => {
    expect(normalize('Beyoncé')).toBe('beyonce')
    expect(normalize('Mötley Crüe')).toBe('motleycrue')
    expect(normalize('Sigur Rós')).toBe('sigurros')
    expect(normalize('Édith Piaf')).toBe('edithpiaf')
  })

  it('two forms of the same name produce equal normalized output', () => {
    expect(normalize('Beyoncé')).toBe(normalize('beyonce'))
    expect(normalize('Céline Dion')).toBe(normalize('celine dion'))
  })

  it('substring containment works after normalization', () => {
    // The guess service uses normalize(song).includes(normalize(input))
    expect(normalize('Beyoncé').includes(normalize('beyonce'))).toBe(true)
    expect(normalize('The Beatles').includes(normalize('beatles'))).toBe(true)
  })

  it('normalizes digits', () => {
    expect(normalize('blink-182')).toBe('blink182')
    expect(normalize('U2')).toBe('u2')
  })

  it('returns empty string for input with no alphanumerics', () => {
    expect(normalize('!!!')).toBe('')
    expect(normalize('   ')).toBe('')
  })
})

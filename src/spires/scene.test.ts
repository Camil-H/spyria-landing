import { describe, expect, test } from 'bun:test'
import {
  seededRandom,
  smoothPathOf,
  spires,
  spiresMarkupOf,
  strandShapesOf,
  thresholdTimingOf,
  travellingLightTimingOf,
  turnSteps,
} from './scene'

describe('seededRandom', () => {
  test('repeats the same numbers for the same seed, within [0, 1)', () => {
    const first = seededRandom(11)
    const second = seededRandom(11)
    const numbers = Array.from({ length: 50 }, () => first())
    expect(numbers).toEqual(Array.from({ length: 50 }, () => second()))
    expect(numbers.every((number) => number >= 0 && number < 1)).toBe(true)
  })
})

describe('smoothPathOf', () => {
  test('starts at the first point and draws one curve per following point', () => {
    const path = smoothPathOf([
      [0, 0],
      [1, 2],
      [3, 4],
    ])
    expect(path.startsWith('M0.00 0.00')).toBe(true)
    expect(path.match(/C/g)).toHaveLength(2)
    expect(path.endsWith('3.00 4.00')).toBe(true)
  })
})

describe('strandShapesOf', () => {
  test('a full turn ends on the shape it started from, so the loop has no jump', () => {
    for (const spire of spires) {
      const shapes = strandShapesOf(spire, 0, turnSteps)
      expect(shapes).toHaveLength(turnSteps + 1)
      expect(shapes.at(-1)).toBe(shapes[0] as string)
    }
  })
})

describe('timings', () => {
  test('a delayed light starts part way through its loop', () => {
    expect(travellingLightTimingOf(20, 0.25)).toEqual({ dur: '20.00s', begin: '-5.00s' })
    expect(thresholdTimingOf(26, 0.42)).toEqual({ dur: '22.40s', begin: '-9.41s' })
  })
})

describe('spiresMarkupOf', () => {
  test('the still frame has no animation and no inline style', () => {
    const still = spiresMarkupOf('hero', true)
    expect(still).not.toContain('<animate')
    expect(still).not.toContain('style=')
  })

  test('the moving frame animates every spire and keeps its ids under the prefix', () => {
    const moving = spiresMarkupOf('hero', false)
    expect(moving.match(/attributeName="d"/g)?.length).toBeGreaterThanOrEqual(spires.length * 2)
    expect(moving).not.toContain('style=')
    const ids = [...moving.matchAll(/\sid="([^"]+)"/g)].map(([, id]) => id ?? '')
    expect(ids.every((id) => id.startsWith('hero-'))).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

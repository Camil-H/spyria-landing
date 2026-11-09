type Depth = 'far' | 'mid' | 'near'
type Layer = {
  depth: Depth
  count: number
  apex: number
  lean: number
  radius: number
  twist: number
  width: number
  turnSeconds: number
  hasPulses: boolean
  hasThresholds: boolean
}
type Spire = Layer & { x: number; key: string }
type Point = readonly [number, number]
type Mote = { x: number; radius: number; seconds: number; delay: number }
type Link = { key: string; d: string; seconds: number }

const baseY = 104
const pixel = 0.075
const vanishingPoint: Point = [50, 16]
const pointsPerStrand = 48
export const turnSteps = 6
const toneOf: Record<Depth, string> = {
  far: 'text-spire-far',
  mid: 'text-spire-mid',
  near: 'text-spire-near',
}
const layers: readonly Layer[] = [
  {
    depth: 'far',
    count: 7,
    apex: 36,
    lean: 0.8,
    radius: 2.4,
    twist: 2.6,
    width: 1,
    turnSeconds: 46,
    hasPulses: false,
    hasThresholds: false,
  },
  {
    depth: 'mid',
    count: 5,
    apex: 28,
    lean: 0.6,
    radius: 4,
    twist: 2.2,
    width: 1.4,
    turnSeconds: 34,
    hasPulses: true,
    hasThresholds: false,
  },
  {
    depth: 'near',
    count: 4,
    apex: 20,
    lean: 0.4,
    radius: 6.5,
    twist: 1.8,
    width: 2,
    turnSeconds: 26,
    hasPulses: true,
    hasThresholds: true,
  },
]

export const seededRandom = (seed: number) => {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state)
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296
  }
}

const edgenessOf = (x: number) => Math.min(Math.abs(x - vanishingPoint[0]) / 50, 1)

const spiresOf = (layer: Layer, random: () => number): Spire[] =>
  Array.from({ length: layer.count }, (_, index) => {
    const x = ((index + 0.5) / layer.count) * 124 - 12 + (random() - 0.5) * (70 / layer.count)
    const edgeness = edgenessOf(x)
    return {
      ...layer,
      x,
      apex: layer.apex - 16 * edgeness ** 1.5,
      lean: layer.lean * (1 - 0.6 * edgeness),
      key: `${layer.depth}-${index}`,
    }
  })

const random = seededRandom(11)
export const spires = layers.flatMap((layer) => spiresOf(layer, random))
export const motes: Mote[] = Array.from({ length: 26 }, () => ({
  x: random() * 100,
  radius: 0.12 + random() * 0.3,
  seconds: 16 + random() * 20,
  delay: random(),
}))

const heightOf = (spire: Spire, along: number) => baseY - along * (baseY - spire.apex)
const radiusOf = (spire: Spire, along: number) => spire.radius * (1 - along) ** 1.15 + 0.1
const axisOf = (spire: Spire, along: number) => spire.x + (vanishingPoint[0] - spire.x) * spire.lean * along ** 1.6
const strandPointOf = (spire: Spire, along: number, phase: number): Point => [
  axisOf(spire, along) + radiusOf(spire, along) * Math.sin(spire.twist * along * 2 * Math.PI + phase),
  heightOf(spire, along),
]

const format = (value: number) => value.toFixed(2)
export const smoothPathOf = (points: readonly Point[]) => {
  const at = (index: number) => points[Math.min(Math.max(index, 0), points.length - 1)] ?? [0, 0]
  const [startX, startY] = at(0)
  return points.slice(1).reduce(
    (path, [x, y], previous) => {
      const [fromX, fromY] = at(previous)
      const [beforeX, beforeY] = at(previous - 1)
      const [afterX, afterY] = at(previous + 2)
      const controls = [
        fromX + (x - beforeX) / 6,
        fromY + (y - beforeY) / 6,
        x - (afterX - fromX) / 6,
        y - (afterY - fromY) / 6,
      ]
      return `${path}C${controls.map(format).join(' ')} ${format(x)} ${format(y)}`
    },
    `M${format(startX)} ${format(startY)}`,
  )
}

export const strandShapesOf = (spire: Spire, strandPhase: number, steps: number) =>
  Array.from({ length: steps + 1 }, (_, step) =>
    smoothPathOf(
      Array.from({ length: pointsPerStrand }, (_, index) =>
        strandPointOf(spire, index / (pointsPerStrand - 1), strandPhase + (step / turnSteps) * 2 * Math.PI),
      ),
    ),
  )

const linksOf = (linked: readonly Spire[]): Link[] => {
  const byPosition = linked.toSorted((first, second) => first.x - second.x)
  return byPosition.slice(1).flatMap((to, index) => {
    const from = byPosition[index]
    if (!from) return []
    const [fromAlong, toAlong] = index % 2 === 0 ? [0.22, 0.58] : [0.4, 0.8]
    const start: Point = [axisOf(from, fromAlong) + radiusOf(from, fromAlong), heightOf(from, fromAlong)]
    const end: Point = [axisOf(to, toAlong) - radiusOf(to, toAlong), heightOf(to, toAlong)]
    const lift = (start[1] - end[1]) * 0.6
    const controls = [start[0], start[1] - lift, end[0], end[1] + lift, ...end].map(format).join(' ')
    return [
      {
        key: `link-${from.key}-${to.key}`,
        d: `M${format(start[0])} ${format(start[1])}C${controls}`,
        seconds: 9 + index * 2.5,
      },
    ]
  })
}
const links = linksOf(spires.filter((spire) => spire.depth !== 'far'))

export const travellingLightTimingOf = (seconds: number, delay = 0) => ({
  dur: `${format(seconds)}s`,
  begin: `${format(-delay * seconds)}s`,
})

export const thresholdTimingOf = (turnSeconds: number, along: number) => {
  const seconds = turnSeconds * 0.7 + along * 10
  return { dur: `${format(seconds)}s`, begin: `${format(-along * seconds)}s` }
}

const attributesOf = (attributes: Record<string, string | number>) =>
  Object.entries(attributes)
    .map(([name, value]) => ` ${name}="${typeof value === 'number' ? format(value) : value}"`)
    .join('')
const element = (name: string, attributes: Record<string, string | number>, children = '') =>
  `<${name}${attributesOf(attributes)}${children ? `>${children}</${name}>` : '/>'}`
const repeating = (attributes: Record<string, string | number>) =>
  element('animate', { ...attributes, repeatCount: 'indefinite' })

const travellingLight = (seconds: number, delay = 0) =>
  repeating({ attributeName: 'stroke-dashoffset', values: '100;0', ...travellingLightTimingOf(seconds, delay) })

const strand = (spire: Spire, strandPhase: number, tipFadeId: string, isStill: boolean) => {
  const shapes = strandShapesOf(spire, strandPhase, isStill ? 0 : turnSteps)
  const turning = isStill
    ? ''
    : repeating({ attributeName: 'd', values: shapes.join(';'), dur: `${spire.turnSeconds}s` })
  const line = element(
    'path',
    {
      d: shapes[0] ?? '',
      fill: 'none',
      stroke: `url(#${tipFadeId})`,
      'stroke-width': spire.width * pixel,
      'stroke-linecap': 'round',
    },
    turning,
  )
  if (!spire.hasPulses || isStill) return line
  const pulse = element(
    'path',
    {
      d: shapes[0] ?? '',
      fill: 'none',
      class: 'text-spire-light',
      stroke: 'currentColor',
      'stroke-width': spire.width * 1.8 * pixel,
      'stroke-linecap': 'round',
      pathLength: '100',
      'stroke-dasharray': '5 95',
    },
    turning + travellingLight(spire.turnSeconds / 2, strandPhase / (2 * Math.PI)),
  )
  return line + pulse
}

const threshold = (spire: Spire, along: number, isStill: boolean) => {
  const width = radiusOf(spire, along) * 1.7
  const timing = { keyTimes: '0;0.3;0.7;1', ...thresholdTimingOf(spire.turnSeconds, along) }
  const animations = isStill
    ? ''
    : repeating({ attributeName: 'rx', values: `0;${format(width)};${format(width)};0`, ...timing }) +
      repeating({ attributeName: 'ry', values: `0;${format(width * 0.26)};${format(width * 0.26)};0`, ...timing }) +
      repeating({ attributeName: 'opacity', values: '0;0.9;0.9;0', ...timing })
  return element(
    'ellipse',
    {
      cx: axisOf(spire, along),
      cy: heightOf(spire, along),
      rx: width,
      ry: width * 0.26,
      fill: 'none',
      class: 'text-spire-light',
      stroke: 'currentColor',
      'stroke-width': spire.width * 0.8 * pixel,
      opacity: isStill ? '0.6' : '0',
    },
    animations,
  )
}

const stillMoteHeightOf = (mote: Mote) => 84 - mote.delay * 66

const mote = (mote: Mote, isStill: boolean) => {
  const timing = travellingLightTimingOf(mote.seconds, mote.delay)
  const animations = isStill
    ? ''
    : repeating({ attributeName: 'cy', values: '86;14', ...timing }) +
      repeating({ attributeName: 'opacity', values: '0;0.9;0.9;0', keyTimes: '0;0.15;0.75;1', ...timing })
  return element(
    'circle',
    { cx: mote.x, cy: isStill ? stillMoteHeightOf(mote) : 86, r: mote.radius, fill: 'currentColor' },
    animations,
  )
}

const link = (link: Link, isStill: boolean) => {
  const line = element('path', { d: link.d, fill: 'none', stroke: 'currentColor', 'stroke-width': pixel })
  if (isStill) return line
  const light = element(
    'path',
    {
      d: link.d,
      fill: 'none',
      class: 'text-spire-light',
      stroke: 'currentColor',
      'stroke-width': 2 * pixel,
      'stroke-linecap': 'round',
      pathLength: '100',
      'stroke-dasharray': '8 92',
    },
    travellingLight(link.seconds),
  )
  return line + light
}

const horizon = (isStill: boolean) =>
  element(
    'ellipse',
    {
      cx: '50',
      cy: '72',
      rx: '30',
      ry: '4.5',
      fill: 'none',
      class: 'text-spire-near',
      stroke: 'currentColor',
      'stroke-width': 1.6 * pixel,
      pathLength: '100',
      'stroke-dasharray': isStill ? '100 0' : '0 100',
    },
    isStill
      ? ''
      : repeating({
          attributeName: 'stroke-dasharray',
          values: '0 100;100 0;100 0;0 100',
          keyTimes: '0;0.4;0.6;1',
          dur: '28s',
        }),
  )

const spireGroup = (spire: Spire, idPrefix: string, isStill: boolean) => {
  const tipFadeId = `${idPrefix}-fade-${spire.key}`
  const tipFade = element(
    'linearGradient',
    { id: tipFadeId, x1: '0', y1: spire.apex, x2: '0', y2: spire.apex + 22, gradientUnits: 'userSpaceOnUse' },
    element('stop', { offset: '0', 'stop-color': 'currentColor', 'stop-opacity': '0' }) +
      element('stop', { offset: '1', 'stop-color': 'currentColor' }),
  )
  return element(
    'g',
    { class: toneOf[spire.depth] },
    element('defs', {}, tipFade) +
      strand(spire, 0, tipFadeId, isStill) +
      strand(spire, Math.PI, tipFadeId, isStill) +
      (spire.hasThresholds ? threshold(spire, 0.42, isStill) : ''),
  )
}

export const spiresMarkupOf = (idPrefix: string, isStill: boolean) => {
  const glowId = `${idPrefix}-glow`
  const fadeId = `${idPrefix}-fade`
  const area = { x: '-20', y: '-20', width: '140', height: '140' }
  const definitions = element(
    'defs',
    {},
    element(
      'radialGradient',
      { id: glowId, cx: '50', cy: '14', r: '60', gradientUnits: 'userSpaceOnUse' },
      element('stop', { offset: '0', class: 'text-spire-glow', 'stop-color': 'currentColor' }) +
        element('stop', { offset: '1', class: 'text-spire-glow', 'stop-color': 'currentColor', 'stop-opacity': '0' }),
    ) +
      element(
        'linearGradient',
        { id: `${fadeId}-gradient`, x1: '0', y1: '0', x2: '0', y2: '1' },
        element('stop', { offset: '0.15', 'stop-color': 'white', 'stop-opacity': '0.4' }) +
          element('stop', { offset: '0.45', 'stop-color': 'white' }) +
          element('stop', { offset: '1', 'stop-color': 'white', 'stop-opacity': '0.85' }),
      ) +
      element(
        'mask',
        { id: fadeId, maskUnits: 'userSpaceOnUse', ...area },
        element('rect', { ...area, fill: `url(#${fadeId}-gradient)` }),
      ),
  )
  const scene =
    spires.map((spire) => spireGroup(spire, idPrefix, isStill)).join('') +
    element('g', { class: 'text-spire-mid' }, links.map((each) => element('g', {}, link(each, isStill))).join('')) +
    horizon(isStill) +
    element('g', { class: 'text-spire-light' }, motes.map((each) => mote(each, isStill)).join(''))
  return (
    definitions +
    element('rect', { ...area, fill: `url(#${glowId})` }) +
    element('g', { mask: `url(#${fadeId})` }, scene)
  )
}

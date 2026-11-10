export const storyCycleSeconds = 22
const storyHoldUntilSeconds = 20.3
const storyFadeSeconds = 0.5

export const storySteps = {
  salimMessage: 0.3,
  camilleReply: 1.3,
  actions: 2.3,
  runtimeLink: 3.6,
  devChat: 4.4,
  camillePrompt: 5.2,
  agentReply: 6.2,
  editRefunds: 7,
  editTest: 7.5,
  testRun: 8,
  salimFollowing: 9,
  agentQuestion: 10,
  salimChoice: 11,
  salimAnswer: 12,
  agentDone: 13,
  pullRequest: 13.8,
} as const

export type StoryStep = keyof typeof storySteps

const percentOf = (seconds: number) => `${((seconds / storyCycleSeconds) * 100).toFixed(2)}%`

const stepKeyframes = (step: StoryStep, appearsAt: number) =>
  `@keyframes story-${step} {
  0%, ${percentOf(appearsAt)} { opacity: 0; }
  ${percentOf(appearsAt + storyFadeSeconds)}, ${percentOf(storyHoldUntilSeconds)} { opacity: 1; }
  ${percentOf(storyHoldUntilSeconds + storyFadeSeconds * 2)}, 100% { opacity: 0; }
}
[data-story-step="${step}"] { animation-name: story-${step}; }`

const storyViewSwaps = ['salimAnswer'] as const satisfies StoryStep[]

const storyPresses = {
  startRuntime: {
    pressedAt: 2.9,
    idleStyle: 'background-color: transparent; color: var(--color-muted);',
    pressedStyle: 'transform: scale(0.85); background-color: var(--color-selected);',
    releasedStyle: '',
  },
  submitAnswer: {
    pressedAt: 11.6,
    idleStyle: 'transform: none;',
    pressedStyle: 'transform: scale(0.9);',
    releasedStyle: 'transform: none;',
  },
}

const viewSwapKeyframes = (step: StoryStep) => {
  const shownUntil = percentOf(storySteps[step])
  const hiddenFrom = percentOf(storySteps[step] + 0.01)
  return `@keyframes story-shown-until-${step} {
  0%, ${shownUntil} { height: auto; }
  ${hiddenFrom}, 100% { height: 0; }
}
@keyframes story-shown-from-${step} {
  0%, ${shownUntil} { height: 0; }
  ${hiddenFrom}, 100% { height: auto; }
}
[data-story-shown-until="${step}"] { animation-name: story-shown-until-${step}; }
[data-story-shown-from="${step}"] { animation-name: story-shown-from-${step}; }
[data-story-shown-until="${step}"], [data-story-shown-from="${step}"] { overflow: hidden; }`
}

const pressKeyframes = (
  press: string,
  { pressedAt, idleStyle, pressedStyle, releasedStyle }: (typeof storyPresses)[keyof typeof storyPresses],
) =>
  `@keyframes story-press-${press} {
  0%, ${percentOf(pressedAt - 0.4)} { ${idleStyle} }
  ${percentOf(pressedAt)} { ${pressedStyle} }
  ${percentOf(pressedAt + 0.3)}, 100% { ${releasedStyle} }
}
[data-story-press="${press}"] { animation-name: story-press-${press}; }`

export const heroStoryStylesheet = [
  `[data-story-step], [data-story-shown-until], [data-story-shown-from], [data-story-press] {
  animation-duration: ${storyCycleSeconds}s;
  animation-timing-function: var(--ease-settle);
  animation-iteration-count: infinite;
}`,
  ...Object.entries(storySteps).map(([step, appearsAt]) => stepKeyframes(step as StoryStep, appearsAt)),
  ...storyViewSwaps.map(viewSwapKeyframes),
  ...Object.entries(storyPresses).map(([press, timing]) => pressKeyframes(press, timing)),
  `@media (prefers-reduced-motion: reduce) {
  [data-story-step], [data-story-shown-until], [data-story-shown-from], [data-story-press] { animation: none; }
  [data-story-shown-until] { height: 0; }
}`,
].join('\n\n')

export const storyCycleSeconds = 22
const storyHoldUntilSeconds = 20.3
const storyFadeSeconds = 0.5
const storyPressSeconds = 2.9

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
  salimAnswer: 11,
  agentDone: 12,
  pullRequest: 12.8,
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

const pressKeyframes = `@keyframes story-press {
  0%, ${percentOf(storyPressSeconds - 0.4)} { background-color: transparent; color: var(--color-muted); }
  ${percentOf(storyPressSeconds)} { transform: scale(0.85); background-color: var(--color-selected); }
}
[data-story-press] { animation-name: story-press; }`

export const heroStoryStylesheet = [
  `[data-story-step], [data-story-press] {
  animation-duration: ${storyCycleSeconds}s;
  animation-timing-function: var(--ease-settle);
  animation-iteration-count: infinite;
}`,
  ...Object.entries(storySteps).map(([step, appearsAt]) => stepKeyframes(step as StoryStep, appearsAt)),
  pressKeyframes,
  `@media (prefers-reduced-motion: reduce) {
  [data-story-step], [data-story-press] { animation: none; }
}`,
].join('\n\n')

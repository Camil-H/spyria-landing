import { spiresMarkupOf } from './scene'

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')

const animateSpires = (spires: SVGSVGElement) => {
  const idPrefix = spires.dataset.spiresAnimated ?? 'spires'
  let isOnScreen = false

  const playOrPause = () => {
    if (isOnScreen && !document.hidden && !reducedMotion.matches) spires.unpauseAnimations()
    else spires.pauseAnimations()
  }
  const render = () => {
    spires.innerHTML = spiresMarkupOf(idPrefix, reducedMotion.matches)
    playOrPause()
  }

  new IntersectionObserver(([entry]) => {
    isOnScreen = entry?.isIntersecting ?? false
    playOrPause()
  }).observe(spires)
  document.addEventListener('visibilitychange', playOrPause)
  reducedMotion.addEventListener('change', render)
  if (!reducedMotion.matches) render()
}

const animateAllSpires = () => {
  for (const spires of document.querySelectorAll<SVGSVGElement>('svg[data-spires-animated]')) animateSpires(spires)
}

if (document.readyState === 'complete') animateAllSpires()
else addEventListener('load', animateAllSpires, { once: true })

import { useEffect, useState } from 'react'
import '../componentsStyle/phase-intro.css'

// Phase-intro component set breakpoints (Figma): desktop >= 990px, tablet 722-989px, mobile 360-721px.
function getViewportBreakpoint() {
  if (typeof window === 'undefined') return 'desktop'
  const width = window.innerWidth
  if (width < 722) return 'mobile'
  if (width < 990) return 'tablet'
  return 'desktop'
}

export default function PhaseIntro({
  breakpoint,
  desc = '티켓 사기는 왜 X(트위터)에 몰리고 사람들은 그런데도 왜 X(트위터)에서 거래할까?',
  headline = '"Why do ticket scams cluster on X(Twitter), and why do people still trade on X(Twitter)?"',
  title = 'EMPATHIZE',
}) {
  const [viewportBreakpoint, setViewportBreakpoint] = useState('desktop')

  useEffect(() => {
    const updateBreakpoint = () => setViewportBreakpoint(getViewportBreakpoint())
    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  // `breakpoint` prop lets Storybook force a variant; otherwise it auto-detects from viewport width.
  const resolvedBreakpoint = breakpoint ?? viewportBreakpoint

  return (
    <section className={`phase-intro phase-intro--${resolvedBreakpoint}`} data-node-id="348:5141">
      <p className="phase-intro__title">{title}</p>
      <div className="phase-intro__contents">
        <p className="phase-intro__headline">{headline}</p>
        {desc ? <p className="phase-intro__description">{desc}</p> : null}
      </div>
    </section>
  )
}

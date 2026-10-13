import { useEffect, useRef, useState } from 'react'
import '../componentsStyle/section-indicator.css'

/**
 * 프로젝트 페이지 왼쪽 고정 섹션 인디케이터.
 * 항목: OVERVIEW(본문 첫 섹션) → 각 .phase-intro(단계) → 마지막 섹션(USABILITY TEST).
 * labels = [OVERVIEW, ...단계명, USABILITY TEST]
 */
export default function SectionIndicator({ selector, labels }) {
  const [active, setActive] = useState(0)
  const [visible, setVisible] = useState(false)
  const targetsRef = useRef([])
  // 모바일(≤721px)에서는 인디케이터를 아예 그리지 않습니다.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 721px)').matches
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 721px)')
    const onChange = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const container = document.querySelector(selector)
    if (!container) return
    const first = container.firstElementChild
    const last = container.querySelector('section[class^="ut-group"]') || container.lastElementChild
    const phases = Array.from(container.querySelectorAll('.phase-intro'))
    targetsRef.current = [first, ...phases, last]

    let raf = 0
    // 페이지 진입 직후(홈에서 내려온 스크롤 위치가 맨 위로 리셋되기 전)에는
    // 컨테이너 위치가 잠깐 화면 중앙에 걸려 인디케이터가 번쩍 보였다 사라집니다.
    // 진입 후 잠깐(전환·스크롤 리셋이 끝날 때까지)은 계속 숨겨둡니다.
    let ready = false
    const readyTimer = setTimeout(() => {
      ready = true
      update()
    }, 900)
    const update = () => {
      raf = 0
      const line = window.innerHeight * 0.4
      let idx = 0
      targetsRef.current.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= line) idx = i
      })
      setActive(idx)
      const rect = container.getBoundingClientRect()
      setVisible(ready && rect.top < window.innerHeight * 0.5 && rect.bottom > window.innerHeight * 0.5)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      clearTimeout(readyTimer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [selector])

  const go = (i) => {
    const el = targetsRef.current[i]
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: 'smooth' })
  }

  if (isMobile) return null

  return (
    <nav
      className={`section-indicator${visible ? ' section-indicator--visible' : ''}`}
      aria-label="Project sections"
    >
      {labels.map((label, i) => (
        <button
          key={label}
          type="button"
          className={`section-indicator__item${i === active ? ' section-indicator__item--active' : ''}`}
          onClick={() => go(i)}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import '../componentsStyle/loading-screen.css'

// Full-screen loading overlay shown once on first load (Figma node 573:8409, "ING").
// 숫자는 "실제로 준비된 만큼" 올라갑니다 — 폰트, 페이지 리소스(window load), 히어로 이미지가
// 준비되는 속도에 맞춰 움직여서, 빠른 컴퓨터/캐시가 있으면 짧게, 느리면 그만큼 더 길게 보입니다.
// onFinish는 100% 도달 후 페이드아웃이 끝난 뒤에 호출됩니다.
const MIN_DURATION = 500 // 너무 빨라도 숫자가 최소한 이 시간은 보이도록(깜빡임 방지)
const MAX_DURATION = 5000 // 어떤 경우에도 이 시간이 지나면 강제로 끝냄(안전장치)
const FADE_DURATION = 500
const PRELOAD_TASKS = 3 // 폰트 / 페이지 load / 히어로 이미지

export default function LoadingScreen({ onFinish }) {
  const [percent, setPercent] = useState(0)
  const [fadingOut, setFadingOut] = useState(false)
  const doneRef = useRef(0)
  const startRef = useRef(null)

  // 폰트(Neue Machina)가 준비되기 전에는 숫자를 아예 그리지 않고(파란 배경만),
  // 준비되면 숫자가 뜨면서 카운트를 시작합니다. 폰트가 끝내 안 와도 1.5초 뒤엔 시작합니다.
  const [fontReady, setFontReady] = useState(false)

  // index.html의 임시 파란 화면은 React 로딩 화면(같은 배경색)이 그려지는 즉시 제거
  useLayoutEffect(() => {
    document.getElementById('boot-loading')?.remove()
  }, [])

  // 실제 준비 상태 추적: 각 작업이 끝날 때마다 doneRef를 하나씩 올립니다.
  useEffect(() => {
    let cancelled = false
    const finishTask = () => {
      if (!cancelled) doneRef.current = Math.min(doneRef.current + 1, PRELOAD_TASKS)
    }

    // 1) 폰트
    let fontDone = false
    const fontFinish = () => {
      if (fontDone) return
      fontDone = true
      setFontReady(true)
      finishTask()
    }
    const fontTimer = setTimeout(fontFinish, 1500)
    if (document.fonts?.load) {
      document.fonts.load('80px "Neue Machina"', '0123456789%').then(fontFinish, fontFinish)
    } else {
      fontFinish()
    }

    // 2) 페이지 리소스(이미지/CSS 등) 로드
    let loadDone = false
    const loadFinish = () => {
      if (loadDone) return
      loadDone = true
      finishTask()
    }
    if (document.readyState === 'complete') loadFinish()
    else window.addEventListener('load', loadFinish, { once: true })

    // 3) 히어로 이미지(홈 첫 화면에 크게 보이는 내 사진)
    let imgDone = false
    const imgFinish = () => {
      if (imgDone) return
      imgDone = true
      finishTask()
    }
    const isMobile = window.matchMedia?.('(max-width: 681px)').matches
    const img = new Image()
    img.onload = imgFinish
    img.onerror = imgFinish
    img.src = `${import.meta.env.BASE_URL}assets/home/${isMobile ? 'image-me-mobile' : 'image-me-fixed'}.svg`
    if (img.complete) imgFinish()

    return () => {
      cancelled = true
      clearTimeout(fontTimer)
      window.removeEventListener('load', loadFinish)
    }
  }, [])

  useEffect(() => {
    if (!fontReady) return
    let rafId = null
    let current = 0
    let last = null

    const tick = (timestamp) => {
      if (startRef.current === null) startRef.current = timestamp
      if (last === null) last = timestamp
      const dt = timestamp - last
      last = timestamp
      const elapsed = timestamp - startRef.current

      // 목표값: 준비된 작업 비율만큼(최대 90%). 전부 끝나고 최소 시간이 지나야 100%로 마무리.
      const allDone = doneRef.current >= PRELOAD_TASKS && elapsed >= MIN_DURATION
      const target = allDone ? 100 : Math.min(90, (doneRef.current / PRELOAD_TASKS) * 90)

      // 목표를 향해 부드럽게 접근(프레임 속도와 무관한 지수 보간)
      current += (target - current) * (1 - Math.exp(-dt / 140))
      if (allDone && current > 99.4) current = 100
      setPercent(Math.round(current))

      if (current >= 100) {
        setFadingOut(true)
      } else {
        rafId = requestAnimationFrame(tick)
      }
    }

    rafId = requestAnimationFrame(tick)

    // 탭이 백그라운드 상태라 rAF가 throttle되거나, 리소스가 끝내 안 와도
    // MAX_DURATION 뒤에는 강제로 끝냅니다 — hero 애니메이션이 영원히 멈추는 일이 없도록.
    const fallbackId = setTimeout(() => {
      setPercent(100)
      setFadingOut(true)
    }, MAX_DURATION)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      clearTimeout(fallbackId)
    }
  }, [fontReady])

  useEffect(() => {
    if (!fadingOut) return
    const timeoutId = setTimeout(() => onFinish?.(), FADE_DURATION)
    return () => clearTimeout(timeoutId)
  }, [fadingOut, onFinish])

  return (
    <div className={`loading-screen${fadingOut ? ' loading-screen--fade-out' : ''}`} aria-hidden={fadingOut}>
      <p className="loading-screen__percent" style={{ visibility: fontReady ? 'visible' : 'hidden' }}>{percent}%</p>
    </div>
  )
}
